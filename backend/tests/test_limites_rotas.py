import io

import pytest
import starlette.requests

from app.config import Settings
from tests.conftest import headers_de

MB = 1024 * 1024
JSON = {"Content-Type": "application/json"}


@pytest.fixture(autouse=True)
def limitador_limpo():
    from app.rate_limit import limitador

    limitador.reset()
    yield
    limitador.reset()


@pytest.fixture
def formularios_lidos(monkeypatch):
    lidos = []
    original = starlette.requests.Request._get_form

    async def espiao(self, **kwargs):
        lidos.append(self.url.path)
        return await original(self, **kwargs)

    monkeypatch.setattr(starlette.requests.Request, "_get_form", espiao)
    return lidos


def colmeia_de(client, h):
    return client.post("/api/colmeias", json={"nome": "Jataí", "especie": "Jataí"}, headers=h).json()


# --- O corpo so e lido depois da autenticacao


def test_json_sem_token_nao_e_lido(client):
    resposta = client.post("/api/colmeias", content=b'{"nome": ', headers=JSON)

    assert resposta.status_code == 401
    assert resposta.headers["www-authenticate"] == "Bearer"


def test_multipart_sem_token_nao_e_lido(client, formularios_lidos):
    resposta = client.post(
        "/api/monitoramentos",
        data={"colmeia_id": "x"},
        files={"arquivo": ("a.jpg", io.BytesIO(b"x" * MB), "image/jpeg")},
    )

    assert resposta.status_code == 401
    assert formularios_lidos == []


def test_multipart_com_token_invalido_nao_e_lido(client, formularios_lidos):
    resposta = client.post(
        "/api/monitoramentos", data={"colmeia_id": "x"}, headers=headers_de("user-tk", token_use="id")
    )

    assert resposta.status_code == 401
    assert formularios_lidos == []


def test_preflight_cors_nao_exige_token(client):
    resposta = client.options(
        "/api/colmeias",
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"},
    )

    assert resposta.status_code == 200


# --- Tamanho do corpo


def test_json_acima_do_limite_responde_413(client):
    h = headers_de("user-json-grande")

    resposta = client.post("/api/colmeias", json={"nome": "A" * (2 * MB), "especie": "Jataí"}, headers=h)

    assert resposta.status_code == 413
    assert client.get("/api/colmeias", headers=h).json() == []


def test_corpo_sem_content_length_tambem_e_limitado(client):
    def pedacos():
        for _ in range(3):
            yield b"x" * MB

    resposta = client.post("/api/colmeias", content=pedacos(), headers={**headers_de("user-chunked"), **JSON})

    assert resposta.status_code == 413


def test_multipart_em_rota_json_nao_ganha_o_limite_de_upload(client):
    resposta = client.post(
        "/api/colmeias",
        files={"arquivo": ("a.jpg", io.BytesIO(b"x" * (2 * MB)), "image/jpeg")},
        headers=headers_de("user-disfarce"),
    )

    assert resposta.status_code == 413


def test_upload_maior_que_o_limite_json_continua_permitido(client):
    h = headers_de("user-upload-ok")
    colmeia = colmeia_de(client, h)

    resposta = client.post(
        "/api/monitoramentos",
        data={"colmeia_id": colmeia["id"]},
        files={"arquivo": ("a.jpg", io.BytesIO(b"x" * (2 * MB)), "image/jpeg")},
        headers=h,
    )

    assert resposta.status_code == 201


def test_requisicao_de_upload_acima_do_teto_responde_413(client, settings, monkeypatch):
    monkeypatch.setattr(settings, "max_upload_mb", 1)
    monkeypatch.setattr(settings, "margem_multipart_mb", 1)
    h = headers_de("user-upload-teto")

    resposta = client.post(
        "/api/monitoramentos",
        data={"colmeia_id": "x"},
        files={"arquivo": ("a.jpg", io.BytesIO(b"x" * (3 * MB)), "image/jpeg")},
        headers=h,
    )

    assert resposta.status_code == 413


# --- Limite por rota


def test_escrita_tem_limite_proprio_sem_afetar_leitura(client, settings, monkeypatch):
    monkeypatch.setattr(settings, "rate_limit_escrita_por_minuto", 2)
    h = headers_de("user-escrita")
    corpo = {"nome": "Jataí", "especie": "Jataí"}

    codigos = [client.post("/api/colmeias", json=corpo, headers=h).status_code for _ in range(3)]

    assert codigos == [201, 201, 429]
    assert client.get("/api/colmeias", headers=h).status_code == 200


def test_excluir_conta_tem_limite_proprio(client, settings, monkeypatch):
    monkeypatch.setattr(settings, "rate_limit_conta_por_minuto", 1)
    h = headers_de("user-conta-limite")

    assert client.delete("/api/conta", headers=h).status_code == 204
    resposta = client.delete("/api/conta", headers=h)

    assert resposta.status_code == 429
    assert "retry-after" in resposta.headers
    assert client.post("/api/colmeias", json={"nome": "Jataí", "especie": "J"}, headers=h).status_code == 201


def test_dashboard_tem_limite_proprio(client, settings, monkeypatch):
    monkeypatch.setattr(settings, "rate_limit_dashboard_por_minuto", 1)
    h = headers_de("user-dash-limite")

    assert client.get("/api/dashboard/resumo", headers=h).status_code == 200
    assert client.get("/api/dashboard/resumo", headers=h).status_code == 429
    assert client.get("/api/colmeias", headers=h).status_code == 200


def test_health_tem_limite_proprio(client, settings, monkeypatch):
    monkeypatch.setattr(settings, "rate_limit_publico_por_minuto", 2)

    assert [client.get("/api/health").status_code for _ in range(3)] == [200, 200, 429]


# --- Autenticacao falha fechada


@pytest.fixture
def sem_configuracao(monkeypatch):
    for variavel in ("AUTH_MODE", "ENVIRONMENT", "COGNITO_USER_POOL_ID", "COGNITO_APP_CLIENT_ID", "VERCEL"):
        monkeypatch.delenv(variavel, raising=False)


def test_sem_configuracao_a_api_nao_sobe_sem_login(sem_configuracao):
    with pytest.raises(ValueError, match="COGNITO_USER_POOL_ID"):
        Settings(_env_file=None)


@pytest.mark.parametrize("ambiente", ["staging", "homologacao", "qa"])
def test_modo_dev_so_em_ambiente_local(sem_configuracao, ambiente):
    with pytest.raises(ValueError, match="AUTH_MODE=dev"):
        Settings(environment=ambiente, auth_mode="dev", _env_file=None)


def test_modo_dev_recusado_na_vercel(sem_configuracao, monkeypatch):
    monkeypatch.setenv("VERCEL", "1")

    with pytest.raises(ValueError, match="AUTH_MODE=dev"):
        Settings(environment="development", auth_mode="dev", _env_file=None)


@pytest.mark.parametrize("ambiente", ["development", "docker", "test"])
def test_modo_dev_explicito_continua_funcionando_localmente(sem_configuracao, ambiente):
    assert Settings(environment=ambiente, auth_mode="dev", _env_file=None).auth_mode == "dev"

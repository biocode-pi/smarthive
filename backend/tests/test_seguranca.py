import time

import pytest
from pydantic import ValidationError

from app.config import Settings
from tests.conftest import headers_de

COLMEIA = {"nome": "Colmeia Teste", "especie": "Jatai"}


def test_rotas_exigem_token(client):
    for rota in ["/api/colmeias", "/api/monitoramentos", "/api/alertas", "/api/dashboard/resumo", "/api/health/db"]:
        assert client.get(rota).status_code == 401, rota


def test_health_publico(client):
    assert client.get("/api/health").status_code == 200


@pytest.mark.parametrize(
    "extras",
    [
        {"client_id": "outro-app"},
        {"token_use": "id"},
        {"iss": "https://cognito-idp.us-east-1.amazonaws.com/OUTRO_POOL"},
        {"exp": int(time.time()) - 10},
    ],
)
def test_token_invalido_rejeitado(client, extras):
    assert client.get("/api/colmeias", headers=headers_de("user-a", **extras)).status_code == 401


def test_usuario_nao_acessa_dados_de_outro(client):
    criada = client.post("/api/colmeias", json=COLMEIA, headers=headers_de("user-a"))
    assert criada.status_code == 201
    colmeia_id = criada.json()["id"]

    b = headers_de("user-b")
    assert all(c["id"] != colmeia_id for c in client.get("/api/colmeias", headers=b).json())
    assert client.get(f"/api/colmeias/{colmeia_id}", headers=b).status_code == 404
    assert client.put(f"/api/colmeias/{colmeia_id}", json={"nome": "Hack"}, headers=b).status_code == 404
    assert client.delete(f"/api/colmeias/{colmeia_id}", headers=b).status_code == 404
    novo_monitoramento = client.post("/api/monitoramentos", data={"colmeia_id": colmeia_id}, headers=b)
    assert novo_monitoramento.status_code == 404

    a = client.get(f"/api/colmeias/{colmeia_id}", headers=headers_de("user-a"))
    assert a.status_code == 200 and a.json()["nome"] == COLMEIA["nome"]


def test_upload_tipo_invalido(client):
    h = headers_de("user-up")
    colmeia_id = client.post("/api/colmeias", json=COLMEIA, headers=h).json()["id"]
    resposta = client.post(
        "/api/monitoramentos",
        data={"colmeia_id": colmeia_id},
        files={"arquivo": ("script.jpg", b"<?php echo 1;", "application/x-php")},
        headers=h,
    )
    assert resposta.status_code == 415


def test_upload_acima_do_limite(client, settings, monkeypatch):
    monkeypatch.setattr(settings, "max_upload_mb", 1)
    h = headers_de("user-up")
    colmeia_id = client.post("/api/colmeias", json=COLMEIA, headers=h).json()["id"]
    resposta = client.post(
        "/api/monitoramentos",
        data={"colmeia_id": colmeia_id},
        files={"arquivo": ("foto.jpg", b"0" * (2 * 1024 * 1024), "image/jpeg")},
        headers=h,
    )
    assert resposta.status_code == 413


def test_upload_valido(client):
    h = headers_de("user-up")
    colmeia_id = client.post("/api/colmeias", json=COLMEIA, headers=h).json()["id"]
    resposta = client.post(
        "/api/monitoramentos",
        data={"colmeia_id": colmeia_id},
        files={"arquivo": ("foto.png", b"\x89PNG fake", "image/png")},
        headers=h,
    )
    assert resposta.status_code == 201
    assert resposta.json()["midia_url"].startswith("/uploads/")


def test_cabecalhos_de_seguranca(client):
    resposta = client.get("/api/health")
    assert resposta.headers["X-Content-Type-Options"] == "nosniff"
    assert resposta.headers["X-Frame-Options"] == "DENY"


def test_producao_exige_cognito():
    with pytest.raises(ValidationError):
        Settings(environment="production", auth_mode="dev", _env_file=None)


@pytest.fixture
def limitador_limpo():
    from app.rate_limit import limitador

    limitador.reset()
    yield
    limitador.reset()


def test_limite_geral_por_ip(client, settings, monkeypatch, limitador_limpo):
    monkeypatch.setattr(settings, "rate_limit_por_minuto", 3)
    h = headers_de("user-rl")
    codigos = [client.get("/api/colmeias", headers=h).status_code for _ in range(4)]
    assert codigos == [200, 200, 200, 429]
    bloqueada = client.get("/api/colmeias", headers=h)
    assert int(bloqueada.headers["Retry-After"]) >= 1
    assert client.get("/api/health").status_code == 200  # healthcheck fica fora do limite


def test_limite_de_upload(client, settings, monkeypatch, limitador_limpo):
    monkeypatch.setattr(settings, "rate_limit_upload_por_minuto", 1)
    h = headers_de("user-rl-up")
    colmeia_id = client.post("/api/colmeias", json=COLMEIA, headers=h).json()["id"]
    dados = {"colmeia_id": colmeia_id}
    assert client.post("/api/monitoramentos", data=dados, headers=h).status_code == 201
    assert client.post("/api/monitoramentos", data=dados, headers=h).status_code == 429
    assert client.get("/api/colmeias", headers=h).status_code == 200  # limite geral e separado


def test_x_forwarded_for_falsificado_nao_burla_limite(client, settings, monkeypatch, limitador_limpo):
    # Producao: CloudFront acrescenta o IP real e o Caddy acrescenta o do CloudFront.
    monkeypatch.setattr(settings, "trusted_proxy_hops", 2)
    monkeypatch.setattr(settings, "rate_limit_por_minuto", 2)
    h = headers_de("user-rl-xff")
    codigos = []
    for i in range(3):
        cadeia = f"10.0.0.{i}, 203.0.113.7, 130.176.0.1"  # 1o item forjado pelo cliente; IP real fixo
        codigos.append(client.get("/api/colmeias", headers={**h, "X-Forwarded-For": cadeia}).status_code)
    assert codigos == [200, 200, 429]


def test_ipv6_do_mesmo_bloco_64_conta_junto(client, settings, monkeypatch, limitador_limpo):
    monkeypatch.setattr(settings, "trusted_proxy_hops", 2)
    monkeypatch.setattr(settings, "rate_limit_por_minuto", 2)
    h = headers_de("user-rl-v6")
    codigos = []
    for i in range(3):
        cadeia = f"2001:db8:abcd:12::{i + 1:x}, 130.176.0.1"  # enderecos diferentes, mesmo /64
        codigos.append(client.get("/api/colmeias", headers={**h, "X-Forwarded-For": cadeia}).status_code)
    assert codigos == [200, 200, 429]


def test_teto_de_chaves_usa_balde_de_excedente():
    from app.rate_limit import FATOR_EXCEDENTE, LimitadorDeRequisicoes

    limitador = LimitadorDeRequisicoes(max_chaves=3)
    assert [limitador.registrar(f"10.0.0.{i}", "geral", 2) for i in range(3)] == [None, None, None]
    # Teto atingido: IPs novos nao sao recusados de cara, dividem o balde de excedente (2 x fator).
    novos = [limitador.registrar(f"10.9.{i}.1", "geral", 2) for i in range(2 * FATOR_EXCEDENTE + 1)]
    assert novos[:-1] == [None] * (2 * FATOR_EXCEDENTE) and novos[-1] is not None
    # Clientes ja conhecidos continuam com o proprio limite, sem efeito do excedente.
    assert limitador.registrar("10.0.0.1", "geral", 2) is None


def test_ip_invalido_vira_chave_unica():
    from app.rate_limit import normalizar_ip

    assert normalizar_ip("lixo-1") == normalizar_ip("lixo-2") == "__invalido__"

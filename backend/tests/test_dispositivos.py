import io

import numpy as np
import onnx
import pytest
from onnx import TensorProto, helper, numpy_helper
from PIL import Image

from app.database import get_store
from app.services import contagem_service
from tests.conftest import headers_de

MB = 1024 * 1024


def jpeg(largura=320, altura=240) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (largura, altura), (200, 170, 40)).save(buffer, format="JPEG")
    return buffer.getvalue()


def criar_colmeia(client, h):
    return client.post("/api/colmeias", json={"nome": "Jataí 1", "especie": "Jataí"}, headers=h).json()


def criar_dispositivo(client, h, colmeia_id, nome="K10 da entrada"):
    return client.post(f"/api/colmeias/{colmeia_id}/dispositivos", json={"nome": nome}, headers=h)


def chave(valor):
    return {"Authorization": f"Dispositivo {valor}"}


def enviar(client, cabecalhos, foto=None, **campos):
    arquivo = {"foto": ("captura.jpg", io.BytesIO(foto if foto is not None else jpeg()), "image/jpeg")}
    return client.post("/api/dispositivos/captura", data=campos, files=arquivo, headers=cabecalhos)


@pytest.fixture
def sem_modelo(monkeypatch, settings, tmp_path):
    monkeypatch.setattr(settings, "modelo_abelhas", tmp_path / "inexistente.onnx")
    contagem_service.limpar_cache()
    yield
    contagem_service.limpar_cache()


@pytest.fixture
def modelo_falso(monkeypatch, settings, tmp_path):
    linhas = np.array(
        [
            [100, 100, 40, 40, 0.90],
            [102, 101, 40, 40, 0.80],
            [400, 300, 50, 50, 0.70],
            [500, 500, 30, 30, 0.10],
        ],
        dtype=np.float32,
    )
    saida = linhas.T[np.newaxis, ...]
    grafo = helper.make_graph(
        [helper.make_node("Constant", [], ["output0"], value=numpy_helper.from_array(saida))],
        "falso",
        [helper.make_tensor_value_info("images", TensorProto.FLOAT, [1, 3, 640, 640])],
        [helper.make_tensor_value_info("output0", TensorProto.FLOAT, [1, 5, 4])],
    )
    modelo = helper.make_model(grafo, opset_imports=[helper.make_opsetid("", 13)])
    modelo.ir_version = 8
    caminho = tmp_path / "falso.onnx"
    onnx.save(modelo, caminho)
    monkeypatch.setattr(settings, "modelo_abelhas", caminho)
    contagem_service.limpar_cache()
    yield
    contagem_service.limpar_cache()


def salvar_classificador(caminho, indice_alto=None):
    logits = np.zeros((1, 1000), dtype=np.float32)
    if indice_alto is not None:
        logits[0, indice_alto] = 12.0
    grafo = helper.make_graph(
        [helper.make_node("Constant", [], ["saida"], value=numpy_helper.from_array(logits))],
        "classificador",
        [helper.make_tensor_value_info("input", TensorProto.FLOAT, [1, 3, 224, 224])],
        [helper.make_tensor_value_info("saida", TensorProto.FLOAT, [1, 1000])],
    )
    modelo = helper.make_model(grafo, opset_imports=[helper.make_opsetid("", 13)])
    modelo.ir_version = 8
    onnx.save(modelo, caminho)


@pytest.fixture
def classificador_com_aranha(monkeypatch, settings, tmp_path):
    caminho = tmp_path / "classificador.onnx"
    salvar_classificador(caminho, indice_alto=73)
    monkeypatch.setattr(settings, "modelo_classificador", caminho)
    contagem_service.limpar_cache()
    yield
    contagem_service.limpar_cache()


@pytest.fixture
def classificador_sem_aranha(monkeypatch, settings, tmp_path):
    caminho = tmp_path / "classificador.onnx"
    salvar_classificador(caminho)
    monkeypatch.setattr(settings, "modelo_classificador", caminho)
    contagem_service.limpar_cache()
    yield
    contagem_service.limpar_cache()


def test_dono_cria_dispositivo_e_recebe_a_chave_uma_vez(client):
    h = headers_de("user-disp-cria")
    colmeia = criar_colmeia(client, h)

    resposta = criar_dispositivo(client, h, colmeia["id"])

    assert resposta.status_code == 201
    criado = resposta.json()
    assert criado["chave"].startswith("shk_") and len(criado["chave"]) > 40
    lista = client.get(f"/api/colmeias/{colmeia['id']}/dispositivos", headers=h).json()
    assert [d["nome"] for d in lista] == ["K10 da entrada"]
    assert "chave" not in lista[0]


def test_chave_fica_guardada_so_como_hash(client):
    h = headers_de("user-disp-hash")
    colmeia = criar_colmeia(client, h)
    criado = criar_dispositivo(client, h, colmeia["id"]).json()

    registros = get_store().list("dispositivos", {"usuario_id": "user-disp-hash"})

    assert criado["chave"] not in str(registros)


def test_outra_conta_nao_ve_nem_cria_dispositivo(client):
    dono, intruso = headers_de("user-disp-dono"), headers_de("user-disp-intruso")
    colmeia = criar_colmeia(client, dono)
    criado = criar_dispositivo(client, dono, colmeia["id"]).json()

    assert criar_dispositivo(client, intruso, colmeia["id"]).status_code == 404
    assert client.get(f"/api/colmeias/{colmeia['id']}/dispositivos", headers=intruso).status_code == 404
    assert client.delete(f"/api/dispositivos/{criado['id']}", headers=intruso).status_code == 404


def test_captura_do_dispositivo_vira_monitoramento_do_dono(client, sem_modelo):
    h = headers_de("user-disp-captura")
    colmeia = criar_colmeia(client, h)
    criado = criar_dispositivo(client, h, colmeia["id"]).json()

    resposta = enviar(client, chave(criado["chave"]), temperatura_c="28.5", umidade_percentual="64")

    assert resposta.status_code == 201, resposta.text
    corpo = resposta.json()
    assert corpo["abelhas"] is None
    monitoramento = client.get(f"/api/monitoramentos/{corpo['monitoramento_id']}", headers=h).json()
    assert monitoramento["colmeia_id"] == colmeia["id"]
    assert monitoramento["origem"] == "iot_futuro"
    assert monitoramento["temperatura_c"] == 28.5
    assert monitoramento["umidade_percentual"] == 64
    assert monitoramento["midia_url"]
    lista = client.get(f"/api/colmeias/{colmeia['id']}/dispositivos", headers=h).json()
    assert lista[0]["ultimo_envio_em"]


def test_captura_conta_abelhas_com_o_modelo(client, modelo_falso):
    h = headers_de("user-disp-conta")
    colmeia = criar_colmeia(client, h)
    criado = criar_dispositivo(client, h, colmeia["id"]).json()

    corpo = enviar(client, chave(criado["chave"])).json()

    assert corpo["abelhas"] == 2
    monitoramento = client.get(f"/api/monitoramentos/{corpo['monitoramento_id']}", headers=h).json()
    assert monitoramento["fluxo_estimado"] == 2
    assert "2 abelhas" in monitoramento["observacoes"]


def test_aranha_na_foto_vira_possivel_invasor_com_alerta(client, modelo_falso, classificador_com_aranha):
    h = headers_de("user-disp-aranha")
    colmeia = criar_colmeia(client, h)
    criado = criar_dispositivo(client, h, colmeia["id"]).json()

    corpo = enviar(client, chave(criado["chave"]), foto=jpeg(640, 480)).json()

    assert corpo["abelhas"] == 2
    assert corpo["invasor"] == "aranha"
    monitoramento = client.get(f"/api/monitoramentos/{corpo['monitoramento_id']}", headers=h).json()
    assert monitoramento["possivel_invasor"] is True
    assert "aranha" in monitoramento["observacoes"].lower()
    alertas = client.get("/api/alertas", headers=h).json()
    assert any(a["monitoramento_id"] == corpo["monitoramento_id"] and a["tipo"] == "possivel_invasor" for a in alertas)


def test_sem_aranha_nao_marca_invasor(client, modelo_falso, classificador_sem_aranha):
    h = headers_de("user-disp-sem-aranha")
    colmeia = criar_colmeia(client, h)
    criado = criar_dispositivo(client, h, colmeia["id"]).json()

    corpo = enviar(client, chave(criado["chave"])).json()

    assert corpo["invasor"] is None
    monitoramento = client.get(f"/api/monitoramentos/{corpo['monitoramento_id']}", headers=h).json()
    assert monitoramento["possivel_invasor"] is False


@pytest.mark.parametrize(
    "cabecalhos",
    [{}, {"Authorization": "Dispositivo shk_invalida"}, {"Authorization": "Bearer qualquer"}],
)
def test_captura_sem_chave_valida_e_recusada(client, cabecalhos):
    assert enviar(client, cabecalhos).status_code == 401


def test_token_de_pessoa_nao_serve_como_chave_de_dispositivo(client):
    assert enviar(client, headers_de("user-disp-token")).status_code == 401


def test_chave_revogada_para_de_funcionar(client, sem_modelo):
    h = headers_de("user-disp-revoga")
    colmeia = criar_colmeia(client, h)
    criado = criar_dispositivo(client, h, colmeia["id"]).json()

    assert client.delete(f"/api/dispositivos/{criado['id']}", headers=h).status_code == 204

    assert enviar(client, chave(criado["chave"])).status_code == 401
    lista = client.get(f"/api/colmeias/{colmeia['id']}/dispositivos", headers=h).json()
    assert lista[0]["revogado_em"]


def test_arquivo_que_nao_e_imagem_e_recusado(client, sem_modelo):
    h = headers_de("user-disp-tipo")
    colmeia = criar_colmeia(client, h)
    criado = criar_dispositivo(client, h, colmeia["id"]).json()

    resposta = client.post(
        "/api/dispositivos/captura",
        files={"foto": ("captura.jpg", io.BytesIO(b"nao sou imagem"), "image/jpeg")},
        headers=chave(criado["chave"]),
    )

    assert resposta.status_code == 415


def test_foto_grande_demais_e_recusada(client, sem_modelo):
    h = headers_de("user-disp-grande")
    colmeia = criar_colmeia(client, h)
    criado = criar_dispositivo(client, h, colmeia["id"]).json()

    resposta = enviar(client, chave(criado["chave"]), foto=b"x" * (7 * MB))

    assert resposta.status_code == 413


def png_enorme() -> bytes:
    buffer = io.BytesIO()
    Image.new("L", (5000, 5000)).save(buffer, format="PNG")
    return buffer.getvalue()


def test_foto_com_dimensoes_enormes_e_recusada(client, sem_modelo):
    h = headers_de("user-disp-pixels")
    colmeia = criar_colmeia(client, h)
    criado = criar_dispositivo(client, h, colmeia["id"]).json()
    foto = png_enorme()
    assert len(foto) < MB

    resposta = enviar(client, chave(criado["chave"]), foto=foto)

    assert resposta.status_code == 413


def test_contagem_ignora_imagem_com_dimensoes_enormes(modelo_falso):
    assert contagem_service.contar(png_enorme()) is None


def test_leituras_fora_da_faixa_sao_recusadas(client, sem_modelo):
    h = headers_de("user-disp-faixa")
    colmeia = criar_colmeia(client, h)
    criado = criar_dispositivo(client, h, colmeia["id"]).json()

    assert enviar(client, chave(criado["chave"]), umidade_percentual="140").status_code == 422


def test_excluir_conta_apaga_os_dispositivos(client):
    h = headers_de("user-disp-conta-fim")
    colmeia = criar_colmeia(client, h)
    criar_dispositivo(client, h, colmeia["id"])

    assert client.delete("/api/conta", headers=h).status_code == 204

    assert get_store().list("dispositivos", {"usuario_id": "user-disp-conta-fim"}) == []

import psycopg
import pytest

from app.database import PostgresStore
from tests.conftest import headers_de

MENSAGEM = "Já existe uma colmeia com este código."


def criar(client, h, **campos):
    return client.post("/api/colmeias", json={"nome": "Jataí 1", "especie": "Jataí", **campos}, headers=h)


def test_codigo_repetido_na_mesma_conta_responde_409(client):
    h = headers_de("user-cod-repetido")
    assert criar(client, h, codigo="JAT-001").status_code == 201

    resposta = criar(client, h, codigo="JAT-001", nome="Outra")

    assert resposta.status_code == 409
    assert resposta.json()["detail"] == MENSAGEM
    assert len(client.get("/api/colmeias", headers=h).json()) == 1


def test_mesmo_codigo_em_contas_diferentes_e_permitido(client):
    assert criar(client, headers_de("user-cod-a"), codigo="JAT-001").status_code == 201
    assert criar(client, headers_de("user-cod-b"), codigo="JAT-001").status_code == 201


def test_codigo_vazio_equivale_a_sem_codigo(client):
    h = headers_de("user-cod-vazio")
    primeira = criar(client, h, codigo="   ")
    segunda = criar(client, h, codigo="")

    assert primeira.status_code == 201 and segunda.status_code == 201
    assert primeira.json()["codigo"] is None and segunda.json()["codigo"] is None


def test_alterar_para_codigo_de_outra_colmeia_responde_409(client):
    h = headers_de("user-cod-put")
    criar(client, h, codigo="JAT-001")
    colmeia = criar(client, h, codigo="JAT-002").json()

    resposta = client.put(f"/api/colmeias/{colmeia['id']}", json={"codigo": "JAT-001"}, headers=h)

    assert resposta.status_code == 409
    assert resposta.json()["detail"] == MENSAGEM
    assert client.get(f"/api/colmeias/{colmeia['id']}", headers=h).json()["codigo"] == "JAT-002"


def test_manter_o_proprio_codigo_ao_alterar_e_permitido(client):
    h = headers_de("user-cod-mesmo")
    colmeia = criar(client, h, codigo="JAT-001").json()

    resposta = client.put(f"/api/colmeias/{colmeia['id']}", json={"codigo": "JAT-001", "nome": "Novo nome"}, headers=h)

    assert resposta.status_code == 200
    assert resposta.json()["nome"] == "Novo nome"


@pytest.mark.parametrize("operacao", ["create", "update"])
def test_postgres_traduz_violacao_de_unicidade(monkeypatch, operacao):
    from app.database import RegistroDuplicado

    def conectar():
        raise psycopg.errors.UniqueViolation("duplicate key")

    store = PostgresStore("postgresql://teste")
    monkeypatch.setattr(store, "_connect", conectar)

    with pytest.raises(RegistroDuplicado):
        if operacao == "create":
            store.create("colmeias", {"nome": "Jataí", "codigo": "JAT-001"})
        else:
            store.update("colmeias", "id-1", {"codigo": "JAT-001"})

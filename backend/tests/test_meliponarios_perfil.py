from tests.conftest import headers_de

MELIPONARIO = {"nome": "Meliponário do Horto", "endereco": "Rua Guará, 1385", "cidade": "Jacupiranga", "uf": "sp"}


def criar_meliponario(client, h, **extras):
    resposta = client.post("/api/meliponarios", json={**MELIPONARIO, **extras}, headers=h)
    assert resposta.status_code == 201, resposta.text
    return resposta.json()


def test_meliponario_com_colmeias_e_alertas(client):
    h = headers_de("user-mel-1")
    meliponario = criar_meliponario(client, h)
    assert meliponario["uf"] == "SP"

    colmeia = client.post(
        "/api/colmeias", json={"nome": "Jataí 1", "especie": "Jataí", "meliponario_id": meliponario["id"]}, headers=h
    ).json()
    client.post("/api/monitoramentos", data={"colmeia_id": colmeia["id"], "possivel_invasor": "true"}, headers=h)

    lido = client.get(f"/api/meliponarios/{meliponario['id']}", headers=h).json()
    assert lido["total_colmeias"] == 1 and lido["alertas_abertos"] == 1

    colmeias = client.get(f"/api/meliponarios/{meliponario['id']}/colmeias", headers=h).json()
    assert [c["id"] for c in colmeias] == [colmeia["id"]]


def test_busca_ignora_acentos_e_filtro_com_alerta(client):
    h = headers_de("user-mel-busca")
    criar_meliponario(client, h, nome="Sítio Uruçu", cidade="Registro")
    com_alerta = criar_meliponario(client, h, nome="Horto Mandaçaia", cidade="São Paulo")
    colmeia = client.post(
        "/api/colmeias", json={"nome": "Mandaçaia 1", "especie": "Mandaçaia", "meliponario_id": com_alerta["id"]}, headers=h
    ).json()
    client.post("/api/alertas", json={"colmeia_id": colmeia["id"], "titulo": "Verificar"}, headers=h)

    assert [m["nome"] for m in client.get("/api/meliponarios?busca=urucu", headers=h).json()] == ["Sítio Uruçu"]
    assert [m["nome"] for m in client.get("/api/meliponarios?busca=sao paulo", headers=h).json()] == ["Horto Mandaçaia"]
    assert [m["nome"] for m in client.get("/api/meliponarios?com_alerta=true", headers=h).json()] == ["Horto Mandaçaia"]


def test_meliponario_isolado_por_usuario(client):
    dono = headers_de("user-mel-dono")
    outro = headers_de("user-mel-outro")
    meliponario = criar_meliponario(client, dono)

    assert client.get("/api/meliponarios", headers=outro).json() == []
    assert client.get(f"/api/meliponarios/{meliponario['id']}", headers=outro).status_code == 404
    assert client.put(f"/api/meliponarios/{meliponario['id']}", json={"nome": "Hack"}, headers=outro).status_code == 404
    assert client.delete(f"/api/meliponarios/{meliponario['id']}", headers=outro).status_code == 404
    # Nao da para colocar uma colmeia propria no meliponario de outra pessoa.
    resposta = client.post(
        "/api/colmeias", json={"nome": "Intrusa", "especie": "Jataí", "meliponario_id": meliponario["id"]}, headers=outro
    )
    assert resposta.status_code == 404


def test_excluir_meliponario_preserva_colmeias(client):
    h = headers_de("user-mel-excluir")
    meliponario = criar_meliponario(client, h)
    colmeia = client.post(
        "/api/colmeias", json={"nome": "Jataí 2", "especie": "Jataí", "meliponario_id": meliponario["id"]}, headers=h
    ).json()

    assert client.delete(f"/api/meliponarios/{meliponario['id']}", headers=h).status_code == 204
    restante = client.get(f"/api/colmeias/{colmeia['id']}", headers=h)
    assert restante.status_code == 200 and restante.json()["meliponario_id"] is None


def test_perfil_registra_consentimento_e_revogacao(client):
    h = headers_de("user-perfil")
    assert client.get("/api/perfil", headers=h).json()["notificacoes_email"] is False

    ativado = client.put("/api/perfil", json={"telefone": "(11) 91234-5678", "notificacoes_email": True}, headers=h).json()
    assert ativado["telefone"] == "11912345678"
    assert ativado["consentimento_em"] and ativado["revogado_em"] is None

    revogado = client.put("/api/perfil", json={"notificacoes_email": False}, headers=h).json()
    assert revogado["notificacoes_email"] is False and revogado["revogado_em"]
    assert revogado["consentimento_em"] == ativado["consentimento_em"]  # historico preservado
    assert revogado["telefone"] == "11912345678"  # campo omitido nao muda

    sem_telefone = client.put("/api/perfil", json={"telefone": None}, headers=h).json()
    assert sem_telefone["telefone"] is None


def test_perfil_rejeita_telefone_invalido(client):
    h = headers_de("user-perfil-invalido")
    assert client.put("/api/perfil", json={"telefone": "1234"}, headers=h).status_code == 422


def test_perfil_isolado_por_usuario(client):
    client.put("/api/perfil", json={"telefone": "11988887777"}, headers=headers_de("user-perfil-a"))
    assert client.get("/api/perfil", headers=headers_de("user-perfil-b")).json().get("telefone") is None

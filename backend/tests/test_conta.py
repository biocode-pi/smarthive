from pathlib import Path

from tests.conftest import headers_de


def popular(client, h):
    meliponario = client.post("/api/meliponarios", json={"nome": "Horto", "cidade": "Registro"}, headers=h).json()
    colmeia = client.post(
        "/api/colmeias", json={"nome": "Jataí 1", "especie": "Jataí", "meliponario_id": meliponario["id"]}, headers=h
    ).json()
    monitoramento = client.post(
        "/api/monitoramentos",
        data={"colmeia_id": colmeia["id"], "possivel_invasor": "true"},
        files={"arquivo": ("foto.png", b"\x89PNG teste", "image/png")},
        headers=h,
    ).json()
    client.put("/api/perfil", json={"telefone": "11912345678", "notificacoes_email": True}, headers=h)
    return monitoramento


def test_excluir_conta_apaga_todos_os_dados_do_usuario(client, settings):
    dono = headers_de("user-excluir-conta")
    monitoramento = popular(client, dono)
    arquivo = Path(settings.upload_dir) / Path(monitoramento["midia_url"]).name
    assert arquivo.is_file()

    assert client.delete("/api/conta", headers=dono).status_code == 204

    for rota in ("/api/meliponarios", "/api/colmeias", "/api/monitoramentos", "/api/alertas"):
        assert client.get(rota, headers=dono).json() == [], rota
    perfil = client.get("/api/perfil", headers=dono).json()
    assert perfil.get("telefone") is None and perfil["notificacoes_email"] is False
    assert not arquivo.exists()


def test_excluir_conta_nao_afeta_outros_usuarios(client):
    dono = headers_de("user-excluir-a")
    outro = headers_de("user-excluir-b")
    popular(client, dono)
    popular(client, outro)

    client.delete("/api/conta", headers=dono)

    assert len(client.get("/api/meliponarios", headers=outro).json()) == 1
    assert len(client.get("/api/colmeias", headers=outro).json()) == 1
    assert len(client.get("/api/monitoramentos", headers=outro).json()) == 1
    assert client.get("/api/perfil", headers=outro).json()["telefone"] == "11912345678"


def test_excluir_conta_exige_login(client):
    assert client.delete("/api/conta").status_code == 401


def test_exclusao_no_s3_fica_restrita_a_pasta_do_usuario(settings, monkeypatch):
    from app.services import storage_service

    apagados = []

    class Paginador:
        def paginate(self, Bucket, Prefix):
            # O S3 so devolve chaves do prefixo pedido; incluimos uma de fora para provar o filtro.
            yield {"Contents": [{"Key": f"{Prefix}a.png"}, {"Key": f"{Prefix}b.mp4"}, {"Key": "usuarios/outro/c.png"}]}

    class S3Falso:
        def get_paginator(self, nome):
            assert nome == "list_objects_v2"
            return Paginador()

        def delete_objects(self, Bucket, Delete):
            apagados.extend(obj["Key"] for obj in Delete["Objects"])

    monkeypatch.setattr(settings, "storage_backend", "s3")
    monkeypatch.setattr(settings, "s3_bucket", "bucket-teste")
    monkeypatch.setattr(storage_service, "_s3_client", lambda: S3Falso())

    assert storage_service.excluir_midias_do_usuario("user-s3", []) == 2
    assert apagados == ["usuarios/user-s3/a.png", "usuarios/user-s3/b.mp4"]

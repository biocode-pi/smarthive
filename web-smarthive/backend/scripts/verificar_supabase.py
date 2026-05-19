from __future__ import annotations

import sys
from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.database import get_store
from app.main import app


def assert_status(response, expected_status: int, label: str) -> None:
    if response.status_code != expected_status:
        raise RuntimeError(f"{label} falhou: {response.status_code} - {response.text}")


def main() -> None:
    client = TestClient(app)
    suffix = uuid4().hex[:8]
    colmeia_id: str | None = None
    monitoramento_id: str | None = None
    alerta_id: str | None = None

    try:
        health = client.get("/api/health/supabase")
        assert_status(health, 200, "health supabase")
        if health.json().get("store", {}).get("mode") not in {"supabase", "postgres"}:
            raise RuntimeError("USE_SUPABASE precisa estar true para executar esta verificacao.")

        created = client.post(
            "/api/colmeias",
            json={
                "nome": f"Colmeia Verificacao Supabase {suffix}",
                "codigo": f"SUPA-{suffix}",
                "especie": "Jatai",
                "localizacao": "Teste automatizado Supabase",
                "descricao": "Registro temporario criado pelo script verificar_supabase.py.",
                "status": "ativa",
            },
        )
        assert_status(created, 201, "criar colmeia")
        colmeia_id = created.json()["id"]

        monitoramento = client.post(
            "/api/monitoramentos",
            data={
                "colmeia_id": colmeia_id,
                "origem": "manual",
                "duracao_segundos": "45",
                "movimentos_estimados": "21",
                "abelhas_entrando": "10",
                "abelhas_saindo": "8",
                "possivel_invasor": "false",
                "observacoes": "Monitoramento temporario para validar gravacao no Supabase.",
            },
        )
        assert_status(monitoramento, 201, "criar monitoramento")
        monitoramento_id = monitoramento.json()["id"]

        alerta = client.post(
            "/api/alertas",
            json={
                "colmeia_id": colmeia_id,
                "monitoramento_id": monitoramento_id,
                "tipo": "sistema",
                "severidade": "baixa",
                "titulo": "Verificacao Supabase",
                "mensagem": "Alerta temporario criado para validar persistencia no Supabase.",
                "resolvido": False,
            },
        )
        assert_status(alerta, 201, "criar alerta")
        alerta_id = alerta.json()["id"]

        resolved = client.put(f"/api/alertas/{alerta_id}/resolver")
        assert_status(resolved, 200, "resolver alerta")

        listed = client.get(f"/api/colmeias/{colmeia_id}/monitoramentos")
        assert_status(listed, 200, "listar monitoramentos da colmeia")
        if not listed.json():
            raise RuntimeError("A colmeia foi criada, mas o monitoramento nao apareceu na consulta.")

        print("Supabase OK: colmeia, monitoramento e alerta foram gravados com sucesso.")
    finally:
        if alerta_id:
            store = get_store()
            store.delete("alertas", alerta_id)
        if monitoramento_id:
            client.delete(f"/api/monitoramentos/{monitoramento_id}")
        if colmeia_id:
            client.delete(f"/api/colmeias/{colmeia_id}")

    print("Registros temporarios limpos.")


if __name__ == "__main__":
    main()

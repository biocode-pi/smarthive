from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.database import get_store
from app.schemas.alerta import AlertaCreate


TABLE = "alertas"


def listar_alertas() -> list[dict]:
    return sorted(get_store().list(TABLE), key=lambda item: item.get("criado_em", ""), reverse=True)


def criar_alerta(payload: AlertaCreate | dict) -> dict:
    dados = payload if isinstance(payload, dict) else payload.model_dump(mode="json")
    return get_store().create(TABLE, dados)


def resolver_alerta(alerta_id: str) -> dict:
    alerta = get_store().update(
        TABLE,
        alerta_id,
        {"resolvido": True, "resolvido_em": datetime.now(timezone.utc).isoformat()},
    )
    if not alerta:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alerta nao encontrado.")
    return alerta

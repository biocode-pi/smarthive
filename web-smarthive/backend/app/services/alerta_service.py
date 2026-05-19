from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.database import get_store
from app.schemas.alerta import AlertaCreate
from app.services import colmeia_service


TABLE = "alertas"


def listar_alertas(owner_id: str | None = None) -> list[dict]:
    rows = get_store().list(TABLE)
    if owner_id:
        permitidos = colmeia_service.colmeia_ids_do_usuario(owner_id)
        rows = [
            item
            for item in rows
            if item.get("colmeia_id") in permitidos or item.get("colmeia_id") is None
        ]
    return sorted(rows, key=lambda item: item.get("criado_em", ""), reverse=True)


def obter_alerta(alerta_id: str, owner_id: str | None = None) -> dict:
    alerta = get_store().get(TABLE, alerta_id)
    if not alerta:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alerta nao encontrado.")
    if owner_id and alerta.get("colmeia_id"):
        colmeia_service.obter_colmeia(alerta["colmeia_id"], owner_id)
    return alerta


def criar_alerta(payload: AlertaCreate | dict, owner_id: str | None = None) -> dict:
    dados = payload if isinstance(payload, dict) else payload.model_dump(mode="json")
    if owner_id and dados.get("colmeia_id"):
        colmeia_service.obter_colmeia(dados["colmeia_id"], owner_id)
    return get_store().create(TABLE, dados)


def resolver_alerta(alerta_id: str, owner_id: str | None = None) -> dict:
    obter_alerta(alerta_id, owner_id)
    alerta = get_store().update(
        TABLE,
        alerta_id,
        {"resolvido": True, "resolvido_em": datetime.now(timezone.utc).isoformat()},
    )
    if not alerta:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alerta nao encontrado.")
    return alerta

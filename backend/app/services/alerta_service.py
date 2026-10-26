from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.database import get_store
from app.schemas.alerta import AlertaCreate


TABLE = "alertas"


def listar_alertas(usuario_id: str) -> list[dict]:
    return sorted(
        get_store().list(TABLE, {"usuario_id": usuario_id}),
        key=lambda item: item.get("criado_em", ""),
        reverse=True,
    )


def criar_alerta(usuario_id: str, payload: AlertaCreate | dict) -> dict:
    from app.services import colmeia_service, monitoramento_service

    dados = payload if isinstance(payload, dict) else payload.model_dump(mode="json")
    # Impede vincular o alerta a colmeia ou monitoramento de outro usuario.
    if dados.get("colmeia_id"):
        colmeia_service.obter_colmeia(usuario_id, dados["colmeia_id"])
    if dados.get("monitoramento_id"):
        monitoramento_service.obter_monitoramento(usuario_id, dados["monitoramento_id"])
    return get_store().create(TABLE, {**dados, "usuario_id": usuario_id})


def resolver_alerta(usuario_id: str, alerta_id: str) -> dict:
    alerta = get_store().get(TABLE, alerta_id)
    if not alerta or alerta.get("usuario_id") != usuario_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alerta não encontrado.")
    return get_store().update(
        TABLE,
        alerta_id,
        {"resolvido": True, "resolvido_em": datetime.now(timezone.utc).isoformat()},
    )

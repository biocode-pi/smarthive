from __future__ import annotations

from fastapi import HTTPException, status

from app.database import get_store
from app.schemas.colmeia import ColmeiaCreate, ColmeiaUpdate


TABLE = "colmeias"


def listar_colmeias() -> list[dict]:
    return sorted(get_store().list(TABLE), key=lambda item: item.get("nome", ""))


def obter_colmeia(colmeia_id: str) -> dict:
    colmeia = get_store().get(TABLE, colmeia_id)
    if not colmeia:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colmeia nao encontrada.")
    return colmeia


def criar_colmeia(payload: ColmeiaCreate) -> dict:
    return get_store().create(TABLE, payload.model_dump(mode="json"))


def atualizar_colmeia(colmeia_id: str, payload: ColmeiaUpdate | dict) -> dict:
    dados = payload if isinstance(payload, dict) else payload.model_dump(exclude_unset=True, mode="json")
    colmeia = get_store().update(TABLE, colmeia_id, dados)
    if not colmeia:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colmeia nao encontrada.")
    return colmeia


def excluir_colmeia(colmeia_id: str) -> None:
    deleted = get_store().delete(TABLE, colmeia_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colmeia nao encontrada.")


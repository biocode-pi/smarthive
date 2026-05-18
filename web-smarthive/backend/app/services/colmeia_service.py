from __future__ import annotations

from fastapi import HTTPException, status

from app.database import get_store
from app.schemas.colmeia import ColmeiaCreate, ColmeiaUpdate


TABLE = "colmeias"


def _user_filter(owner_id: str | None) -> dict | None:
    return {"user_id": owner_id} if owner_id else None


def listar_colmeias(owner_id: str | None = None) -> list[dict]:
    rows = get_store().list(TABLE, where=_user_filter(owner_id))
    return sorted(rows, key=lambda item: (item.get("nome") or "").lower())


def obter_colmeia(colmeia_id: str, owner_id: str | None = None) -> dict:
    colmeia = get_store().get(TABLE, colmeia_id)
    if not colmeia:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colmeia nao encontrada.")
    if owner_id and colmeia.get("user_id") and colmeia["user_id"] != owner_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colmeia nao encontrada.")
    return colmeia


def criar_colmeia(payload: ColmeiaCreate, owner_id: str | None = None) -> dict:
    dados = payload.model_dump(mode="json")
    if owner_id:
        dados["user_id"] = owner_id
    return get_store().create(TABLE, dados)


def atualizar_colmeia(colmeia_id: str, payload: ColmeiaUpdate | dict, owner_id: str | None = None) -> dict:
    obter_colmeia(colmeia_id, owner_id)
    dados = payload if isinstance(payload, dict) else payload.model_dump(exclude_unset=True, mode="json")
    dados.pop("user_id", None)
    colmeia = get_store().update(TABLE, colmeia_id, dados)
    if not colmeia:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colmeia nao encontrada.")
    return colmeia


def excluir_colmeia(colmeia_id: str, owner_id: str | None = None) -> None:
    obter_colmeia(colmeia_id, owner_id)
    deleted = get_store().delete(TABLE, colmeia_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colmeia nao encontrada.")


def colmeia_ids_do_usuario(owner_id: str | None) -> set[str]:
    if not owner_id:
        return {item["id"] for item in get_store().list(TABLE) if item.get("id")}
    return {item["id"] for item in listar_colmeias(owner_id) if item.get("id")}

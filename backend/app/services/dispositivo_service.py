from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.database import get_store
from app.services import colmeia_service


TABLE = "dispositivos"
PREFIXO = "shk_"
CAMPOS_PUBLICOS = ("id", "colmeia_id", "nome", "criado_em", "ultimo_envio_em", "revogado_em")


def _agora() -> str:
    return datetime.now(timezone.utc).isoformat()


def _hash(chave: str) -> str:
    return hashlib.sha256(chave.encode("utf-8")).hexdigest()


def _publico(dispositivo: dict) -> dict:
    return {campo: dispositivo.get(campo) for campo in CAMPOS_PUBLICOS}


def chave_invalida() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Chave do dispositivo inválida ou ausente.",
        headers={"WWW-Authenticate": "Dispositivo"},
    )


def listar(usuario_id: str, colmeia_id: str) -> list[dict]:
    colmeia_service.obter_colmeia(usuario_id, colmeia_id)
    itens = get_store().list(TABLE, {"usuario_id": usuario_id, "colmeia_id": colmeia_id})
    return [_publico(item) for item in sorted(itens, key=lambda item: item.get("criado_em", ""))]


def criar(usuario_id: str, colmeia_id: str, nome: str) -> dict:
    colmeia_service.obter_colmeia(usuario_id, colmeia_id)
    chave = PREFIXO + secrets.token_urlsafe(32)
    registro = get_store().create(
        TABLE,
        {"usuario_id": usuario_id, "colmeia_id": colmeia_id, "nome": nome, "chave_hash": _hash(chave)},
    )
    return {**_publico(registro), "chave": chave}


def revogar(usuario_id: str, dispositivo_id: str) -> None:
    store = get_store()
    dispositivo = store.get(TABLE, dispositivo_id)
    if not dispositivo or dispositivo.get("usuario_id") != usuario_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispositivo não encontrado.")
    if not dispositivo.get("revogado_em"):
        store.update(TABLE, dispositivo_id, {"revogado_em": _agora()})


def autenticar(cabecalho: str | None) -> dict:
    esquema, _, chave = (cabecalho or "").partition(" ")
    chave = chave.strip()
    if esquema.lower() != "dispositivo" or not chave.startswith(PREFIXO):
        raise chave_invalida()
    for dispositivo in get_store().list(TABLE, {"chave_hash": _hash(chave)}):
        if not dispositivo.get("revogado_em"):
            return dispositivo
    raise chave_invalida()


def registrar_envio(dispositivo_id: str) -> None:
    get_store().update(TABLE, dispositivo_id, {"ultimo_envio_em": _agora()})

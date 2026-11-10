from __future__ import annotations

from datetime import datetime, timezone

from app.database import get_store
from app.schemas.perfil import PerfilUpdate


TABLE = "perfis"


def obter_perfil(usuario_id: str) -> dict:
    return get_store().get(TABLE, usuario_id) or {"notificacoes_email": False}


def atualizar_perfil(usuario_id: str, payload: PerfilUpdate) -> dict:
    store = get_store()
    atual = store.get(TABLE, usuario_id)
    agora = datetime.now(timezone.utc).isoformat()
    dados: dict = {}

    if "telefone" in payload.model_fields_set:
        dados["telefone"] = payload.telefone

    if payload.notificacoes_email is not None:
        ja_ativo = bool(atual and atual.get("notificacoes_email"))
        dados["notificacoes_email"] = payload.notificacoes_email
        # Guarda quando o consentimento foi dado e quando foi revogado (prova para a LGPD).
        if payload.notificacoes_email and not ja_ativo:
            dados["consentimento_em"] = agora
            dados["revogado_em"] = None
        elif not payload.notificacoes_email and ja_ativo:
            dados["revogado_em"] = agora

    if atual is None:
        return store.create(TABLE, {"id": usuario_id, "usuario_id": usuario_id, "notificacoes_email": False, **dados})
    if not dados:
        return atual
    return store.update(TABLE, usuario_id, dados)

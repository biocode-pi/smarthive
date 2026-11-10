from __future__ import annotations

from fastapi import HTTPException, status

from app.database import RegistroDuplicado, get_store
from app.schemas.colmeia import ColmeiaCreate, ColmeiaUpdate


TABLE = "colmeias"


def _codigo_repetido() -> HTTPException:
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Já existe uma colmeia com este código.")


def listar_colmeias(usuario_id: str) -> list[dict]:
    return sorted(get_store().list(TABLE, {"usuario_id": usuario_id}), key=lambda item: item.get("nome", ""))


def obter_colmeia(usuario_id: str, colmeia_id: str) -> dict:
    colmeia = get_store().get(TABLE, colmeia_id)
    # Colmeia de outro usuario responde 404, para nao revelar que o id existe.
    if not colmeia or colmeia.get("usuario_id") != usuario_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colmeia não encontrada.")
    return colmeia


def criar_colmeia(usuario_id: str, payload: ColmeiaCreate) -> dict:
    from app.services import meliponario_service

    meliponario_service.validar_dono(usuario_id, payload.meliponario_id)
    try:
        return get_store().create(TABLE, {**payload.model_dump(mode="json"), "usuario_id": usuario_id})
    except RegistroDuplicado as exc:
        raise _codigo_repetido() from exc


def atualizar_colmeia(usuario_id: str, colmeia_id: str, payload: ColmeiaUpdate | dict) -> dict:
    from app.services import meliponario_service

    obter_colmeia(usuario_id, colmeia_id)
    dados = payload if isinstance(payload, dict) else payload.model_dump(exclude_unset=True, mode="json")
    meliponario_service.validar_dono(usuario_id, dados.get("meliponario_id"))
    try:
        colmeia = get_store().update(TABLE, colmeia_id, dados)
    except RegistroDuplicado as exc:
        raise _codigo_repetido() from exc
    if not colmeia:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colmeia não encontrada.")
    return colmeia


def excluir_colmeia(usuario_id: str, colmeia_id: str) -> None:
    obter_colmeia(usuario_id, colmeia_id)
    store = get_store()
    # Remove os dados dependentes explicitamente: o JSON local nao tem chaves estrangeiras,
    # e um alerta de colmeia apagada continuaria aparecendo na lista.
    for tabela in ("alertas", "capturas_sensor_celular", "monitoramentos"):
        for item in store.list(tabela, {"usuario_id": usuario_id, "colmeia_id": colmeia_id}):
            store.delete(tabela, item["id"])
    if not store.delete(TABLE, colmeia_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Colmeia não encontrada.")

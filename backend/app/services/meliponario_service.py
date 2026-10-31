from __future__ import annotations

import unicodedata

from fastapi import HTTPException, status

from app.database import get_store
from app.schemas.meliponario import MeliponarioCreate, MeliponarioUpdate


TABLE = "meliponarios"


def _sem_acentos(texto: str) -> str:
    texto = unicodedata.normalize("NFKD", texto.lower())
    return "".join(c for c in texto if not unicodedata.combining(c))


def _com_agregados(usuario_id: str, meliponarios: list[dict]) -> list[dict]:
    store = get_store()
    colmeias = store.list("colmeias", {"usuario_id": usuario_id})
    alertas = [a for a in store.list("alertas", {"usuario_id": usuario_id}) if not a.get("resolvido")]
    meliponario_da_colmeia = {c["id"]: c.get("meliponario_id") for c in colmeias}

    resultado = []
    for meliponario in meliponarios:
        mid = meliponario["id"]
        resultado.append(
            {
                **meliponario,
                "total_colmeias": sum(1 for c in colmeias if c.get("meliponario_id") == mid),
                "alertas_abertos": sum(1 for a in alertas if meliponario_da_colmeia.get(a.get("colmeia_id")) == mid),
            }
        )
    return resultado


def listar_meliponarios(usuario_id: str, busca: str | None = None, com_alerta: bool = False) -> list[dict]:
    itens = _com_agregados(usuario_id, get_store().list(TABLE, {"usuario_id": usuario_id}))
    if busca:
        termo = _sem_acentos(busca.strip())
        itens = [
            m for m in itens if termo in _sem_acentos(f"{m.get('nome') or ''} {m.get('cidade') or ''} {m.get('endereco') or ''}")
        ]
    if com_alerta:
        itens = [m for m in itens if m["alertas_abertos"] > 0]
    return sorted(itens, key=lambda m: _sem_acentos(m.get("nome", "")))


def _obter_bruto(usuario_id: str, meliponario_id: str) -> dict:
    meliponario = get_store().get(TABLE, meliponario_id)
    if not meliponario or meliponario.get("usuario_id") != usuario_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meliponário não encontrado.")
    return meliponario


def obter_meliponario(usuario_id: str, meliponario_id: str) -> dict:
    return _com_agregados(usuario_id, [_obter_bruto(usuario_id, meliponario_id)])[0]


def validar_dono(usuario_id: str, meliponario_id: str | None) -> None:
    """Impede vincular uma colmeia a meliponario de outro usuario."""
    if meliponario_id:
        _obter_bruto(usuario_id, meliponario_id)


def criar_meliponario(usuario_id: str, payload: MeliponarioCreate) -> dict:
    dados = payload.model_dump(mode="json")
    if dados.get("uf"):
        dados["uf"] = dados["uf"].upper()
    criado = get_store().create(TABLE, {**dados, "usuario_id": usuario_id})
    return _com_agregados(usuario_id, [criado])[0]


def atualizar_meliponario(usuario_id: str, meliponario_id: str, payload: MeliponarioUpdate) -> dict:
    _obter_bruto(usuario_id, meliponario_id)
    dados = payload.model_dump(exclude_unset=True, mode="json")
    if dados.get("uf"):
        dados["uf"] = dados["uf"].upper()
    atualizado = get_store().update(TABLE, meliponario_id, dados)
    return _com_agregados(usuario_id, [atualizado])[0]


def excluir_meliponario(usuario_id: str, meliponario_id: str) -> None:
    _obter_bruto(usuario_id, meliponario_id)
    store = get_store()
    # As colmeias nao sao apagadas: ficam sem meliponario e continuam no historico.
    for colmeia in store.list("colmeias", {"usuario_id": usuario_id, "meliponario_id": meliponario_id}):
        store.update("colmeias", colmeia["id"], {"meliponario_id": None})
    store.delete(TABLE, meliponario_id)

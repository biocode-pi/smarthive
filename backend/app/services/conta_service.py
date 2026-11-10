from __future__ import annotations

import logging

from app.database import get_store
from app.services import storage_service


logger = logging.getLogger("smarthive")

TABELAS = ("alertas", "capturas_sensor_celular", "monitoramentos", "colmeias", "meliponarios", "perfis")


def excluir_dados_do_usuario(usuario_id: str) -> dict[str, int]:
    store = get_store()
    referencias = [
        item.get("midia_url")
        for tabela in ("monitoramentos", "capturas_sensor_celular")
        for item in store.list(tabela, {"usuario_id": usuario_id})
        if item.get("midia_url")
    ]
    removidos: dict[str, int] = {}
    for tabela in TABELAS:
        itens = store.list(tabela, {"usuario_id": usuario_id})
        for item in itens:
            store.delete(tabela, item["id"])
        removidos[tabela] = len(itens)

    removidos["midias"] = storage_service.excluir_midias_do_usuario(usuario_id, referencias)
    logger.info("Dados do usuario excluidos a pedido dele: %s", removidos)
    return removidos

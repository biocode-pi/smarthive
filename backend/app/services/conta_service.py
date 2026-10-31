"""Exclusao de todos os dados de um usuario (direito de eliminacao, LGPD art. 18, VI).

A conta no Cognito e excluida pelo proprio usuario no navegador (com o token dele),
logo depois desta limpeza; a API nao precisa de permissao administrativa no Cognito.
"""

from __future__ import annotations

import logging

from app.database import get_store
from app.services import storage_service


logger = logging.getLogger("smarthive")

# Ordem: dependentes primeiro, para respeitar as chaves estrangeiras do PostgreSQL.
TABELAS = ("alertas", "capturas_sensor_celular", "monitoramentos", "colmeias", "meliponarios", "perfis")


def excluir_dados_do_usuario(usuario_id: str) -> dict[str, int]:
    store = get_store()
    # Guarda as referencias das midias antes de apagar os registros que apontam para elas.
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

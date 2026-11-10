from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status

from app.database import get_store
from app.schemas.monitoramento import MonitoramentoUpdate
from app.services import alerta_service, colmeia_service, ia_service, storage_service


TABLE = "monitoramentos"


def _com_midia_resolvida(usuario_id: str, monitoramento: dict) -> dict:
    return {**monitoramento, "midia_url": storage_service.url_de_leitura(usuario_id, monitoramento.get("midia_url"))}


def listar_monitoramentos(usuario_id: str) -> list[dict]:
    itens = sorted(
        get_store().list(TABLE, {"usuario_id": usuario_id}),
        key=lambda item: item.get("data_hora") or item.get("criado_em", ""),
        reverse=True,
    )
    return [_com_midia_resolvida(usuario_id, item) for item in itens]


def _obter_bruto(usuario_id: str, monitoramento_id: str) -> dict:
    monitoramento = get_store().get(TABLE, monitoramento_id)
    if not monitoramento or monitoramento.get("usuario_id") != usuario_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Monitoramento não encontrado.")
    return monitoramento


def obter_monitoramento(usuario_id: str, monitoramento_id: str) -> dict:
    return _com_midia_resolvida(usuario_id, _obter_bruto(usuario_id, monitoramento_id))


def listar_por_colmeia(usuario_id: str, colmeia_id: str) -> list[dict]:
    colmeia_service.obter_colmeia(usuario_id, colmeia_id)
    return [item for item in listar_monitoramentos(usuario_id) if item.get("colmeia_id") == colmeia_id]


def criar_monitoramento(usuario_id: str, dados: dict[str, Any]) -> dict:
    colmeia = colmeia_service.obter_colmeia(usuario_id, dados["colmeia_id"])
    dados = {**dados, "usuario_id": usuario_id}

    if not dados.get("data_hora"):
        dados["data_hora"] = datetime.now(timezone.utc).isoformat()
    dados["fluxo_estimado"] = dados.get("fluxo_estimado") or (
        (dados.get("abelhas_entrando") or 0) + (dados.get("abelhas_saindo") or 0)
    )
    dados["possivel_invasor"] = ia_service.detectar_possivel_invasor(
        bool(dados.get("possivel_invasor")),
        dados.get("observacoes"),
    )
    dados["analise_experimental"] = ia_service.analisar_fluxo_experimental(
        dados.get("movimentos_estimados"),
        dados.get("abelhas_entrando"),
        dados.get("abelhas_saindo"),
    )

    monitoramento = get_store().create(TABLE, dados)

    novo_status = ia_service.classificar_status_colmeia(
        dados.get("fluxo_estimado"),
        dados["possivel_invasor"],
        colmeia.get("status", "ativa"),
    )
    if novo_status != colmeia.get("status"):
        colmeia_service.atualizar_colmeia(usuario_id, colmeia["id"], {"status": novo_status})

    if dados["possivel_invasor"]:
        alerta_service.criar_alerta(
            usuario_id,
            {
                "colmeia_id": colmeia["id"],
                "monitoramento_id": monitoramento["id"],
                "tipo": "possivel_invasor",
                "severidade": "alta",
                "titulo": "Possível invasor registrado",
                "mensagem": "O monitoramento indicou possível presença de invasor na entrada da colmeia.",
                "resolvido": False,
            },
        )

    return _com_midia_resolvida(usuario_id, monitoramento)


def atualizar_monitoramento(usuario_id: str, monitoramento_id: str, payload: MonitoramentoUpdate) -> dict:
    _obter_bruto(usuario_id, monitoramento_id)
    dados = payload.model_dump(exclude_unset=True, mode="json")
    monitoramento = get_store().update(TABLE, monitoramento_id, dados)
    if not monitoramento:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Monitoramento não encontrado.")
    return _com_midia_resolvida(usuario_id, monitoramento)


def excluir_monitoramento(usuario_id: str, monitoramento_id: str) -> None:
    _obter_bruto(usuario_id, monitoramento_id)
    if not get_store().delete(TABLE, monitoramento_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Monitoramento não encontrado.")

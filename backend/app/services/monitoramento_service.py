from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status

from app.database import get_store
from app.schemas.monitoramento import MonitoramentoCreate, MonitoramentoUpdate
from app.services import alerta_service, colmeia_service, ia_service


TABLE = "monitoramentos"


def listar_monitoramentos() -> list[dict]:
    return sorted(get_store().list(TABLE), key=lambda item: item.get("data_hora") or item.get("criado_em", ""), reverse=True)


def obter_monitoramento(monitoramento_id: str) -> dict:
    monitoramento = get_store().get(TABLE, monitoramento_id)
    if not monitoramento:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Monitoramento nao encontrado.")
    return monitoramento


def listar_por_colmeia(colmeia_id: str) -> list[dict]:
    colmeia_service.obter_colmeia(colmeia_id)
    return [item for item in listar_monitoramentos() if item.get("colmeia_id") == colmeia_id]


def criar_monitoramento(payload: MonitoramentoCreate | dict[str, Any]) -> dict:
    dados = payload if isinstance(payload, dict) else payload.model_dump(mode="json")
    colmeia = colmeia_service.obter_colmeia(dados["colmeia_id"])

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
        colmeia_service.atualizar_colmeia(colmeia["id"], {"status": novo_status})

    if dados["possivel_invasor"]:
        alerta_service.criar_alerta(
            {
                "colmeia_id": colmeia["id"],
                "monitoramento_id": monitoramento["id"],
                "tipo": "possivel_invasor",
                "severidade": "alta",
                "titulo": "Possivel invasor registrado",
                "mensagem": "O monitoramento indicou possivel presenca de invasor na entrada da colmeia.",
                "resolvido": False,
            }
        )

    return monitoramento


def atualizar_monitoramento(monitoramento_id: str, payload: MonitoramentoUpdate) -> dict:
    dados = payload.model_dump(exclude_unset=True, mode="json")
    monitoramento = get_store().update(TABLE, monitoramento_id, dados)
    if not monitoramento:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Monitoramento nao encontrado.")
    return monitoramento


def excluir_monitoramento(monitoramento_id: str) -> None:
    deleted = get_store().delete(TABLE, monitoramento_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Monitoramento nao encontrado.")

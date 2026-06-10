import asyncio

from fastapi import APIRouter

from app.services import alerta_service, colmeia_service, monitoramento_service


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/resumo")
async def obter_resumo():
    colmeias, monitoramentos, alertas = await asyncio.gather(
        asyncio.to_thread(colmeia_service.listar_colmeias),
        asyncio.to_thread(monitoramento_service.listar_monitoramentos),
        asyncio.to_thread(alerta_service.listar_alertas),
    )

    return {
        "total_colmeias": len(colmeias),
        "colmeias_ativas": len([item for item in colmeias if item.get("status") == "ativa"]),
        "colmeias_em_observacao": len([item for item in colmeias if item.get("status") == "observacao"]),
        "colmeias_em_risco": len([item for item in colmeias if item.get("status") == "risco"]),
        "monitoramentos_realizados": len(monitoramentos),
        "alertas_abertos": len([item for item in alertas if not item.get("resolvido")]),
        "ultimos_monitoramentos": monitoramentos[:5],
        "alertas_recentes": alertas[:5],
        "sensor_celular": {
            "ativo": True,
            "descricao": "Nesta fase, o celular funciona como sensor visual experimental antes do IoT dedicado.",
        },
    }

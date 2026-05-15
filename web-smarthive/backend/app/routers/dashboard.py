from fastapi import APIRouter

from app.services import alerta_service, colmeia_service, monitoramento_service


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/resumo")
def obter_resumo():
    colmeias = colmeia_service.listar_colmeias()
    monitoramentos = monitoramento_service.listar_monitoramentos()
    alertas = alerta_service.listar_alertas()

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


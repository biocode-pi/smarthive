import asyncio

from fastapi import APIRouter, Depends

from app.auth import Usuario, get_usuario_atual

from app.services import alerta_service, colmeia_service, monitoramento_service


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/resumo")
async def obter_resumo(usuario: Usuario = Depends(get_usuario_atual)):
    colmeias, monitoramentos, alertas = await asyncio.gather(
        asyncio.to_thread(colmeia_service.listar_colmeias, usuario.id),
        asyncio.to_thread(monitoramento_service.listar_monitoramentos, usuario.id),
        asyncio.to_thread(alerta_service.listar_alertas, usuario.id),
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

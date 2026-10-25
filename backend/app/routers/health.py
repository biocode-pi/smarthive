import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import Usuario, get_usuario_atual
from app.config import get_settings
from app.database import get_store


router = APIRouter(prefix="/health", tags=["Health"])
logger = logging.getLogger("smarthive")


@router.get("")
def healthcheck():
    # Publico: usado pelo healthcheck do Docker e do load balancer. Nao expor detalhes internos.
    return {"status": "ok", "app": get_settings().app_name}


@router.get("/db")
def verificar_banco(_: Usuario = Depends(get_usuario_atual)):
    try:
        store_status = get_store().ping()
    except Exception as exc:
        logger.exception("Falha ao verificar o banco")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Banco de dados indisponivel.",
        ) from exc
    return {"status": "ok", "store": {"mode": store_status["mode"], "status": store_status["status"]}}

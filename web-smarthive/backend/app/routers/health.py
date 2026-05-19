from fastapi import APIRouter, HTTPException, status

from app.config import get_settings
from app.database import get_store


router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
def healthcheck():
    settings = get_settings()
    return {
        "status": "ok",
        "app": settings.app_name,
        "environment": settings.environment,
        "use_supabase": settings.use_supabase,
    }


@router.get("/supabase")
def verificar_supabase():
    settings = get_settings()
    if not settings.use_supabase:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="USE_SUPABASE=false. Ative USE_SUPABASE=true no backend/.env para validar o Supabase.",
        )

    try:
        store_status = get_store().ping()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    return {
        "status": "ok",
        "store": store_status,
    }

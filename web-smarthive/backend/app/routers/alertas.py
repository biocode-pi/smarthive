from fastapi import APIRouter, status

from app.auth import CurrentUser
from app.schemas.alerta import Alerta, AlertaCreate
from app.services import alerta_service


router = APIRouter(prefix="/alertas", tags=["Alertas"])


@router.get("", response_model=list[Alerta])
def listar_alertas(current_user: CurrentUser):
    return alerta_service.listar_alertas(current_user)


@router.post("", response_model=Alerta, status_code=status.HTTP_201_CREATED)
def criar_alerta(payload: AlertaCreate, current_user: CurrentUser):
    return alerta_service.criar_alerta(payload, current_user)


@router.put("/{alerta_id}/resolver", response_model=Alerta)
def resolver_alerta(alerta_id: str, current_user: CurrentUser):
    return alerta_service.resolver_alerta(alerta_id, current_user)

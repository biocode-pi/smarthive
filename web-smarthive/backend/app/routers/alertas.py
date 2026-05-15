from fastapi import APIRouter, status

from app.schemas.alerta import Alerta, AlertaCreate
from app.services import alerta_service


router = APIRouter(prefix="/alertas", tags=["Alertas"])


@router.get("", response_model=list[Alerta])
def listar_alertas():
    return alerta_service.listar_alertas()


@router.post("", response_model=Alerta, status_code=status.HTTP_201_CREATED)
def criar_alerta(payload: AlertaCreate):
    return alerta_service.criar_alerta(payload)


@router.put("/{alerta_id}/resolver", response_model=Alerta)
def resolver_alerta(alerta_id: str):
    return alerta_service.resolver_alerta(alerta_id)


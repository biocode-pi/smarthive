from fastapi import APIRouter, Depends, status

from app.auth import Usuario, get_usuario_atual
from app.schemas.alerta import Alerta, AlertaCreate
from app.services import alerta_service


router = APIRouter(prefix="/alertas", tags=["Alertas"])


@router.get("", response_model=list[Alerta])
def listar_alertas(usuario: Usuario = Depends(get_usuario_atual)):
    return alerta_service.listar_alertas(usuario.id)


@router.post("", response_model=Alerta, status_code=status.HTTP_201_CREATED)
def criar_alerta(payload: AlertaCreate, usuario: Usuario = Depends(get_usuario_atual)):
    return alerta_service.criar_alerta(usuario.id, payload)


@router.put("/{alerta_id}/resolver", response_model=Alerta)
def resolver_alerta(alerta_id: str, usuario: Usuario = Depends(get_usuario_atual)):
    return alerta_service.resolver_alerta(usuario.id, alerta_id)

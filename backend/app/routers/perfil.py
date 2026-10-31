from fastapi import APIRouter, Depends

from app.auth import Usuario, get_usuario_atual
from app.schemas.perfil import Perfil, PerfilUpdate
from app.services import perfil_service


router = APIRouter(prefix="/perfil", tags=["Perfil"])


@router.get("", response_model=Perfil)
def obter_perfil(usuario: Usuario = Depends(get_usuario_atual)):
    return perfil_service.obter_perfil(usuario.id)


@router.put("", response_model=Perfil)
def atualizar_perfil(payload: PerfilUpdate, usuario: Usuario = Depends(get_usuario_atual)):
    return perfil_service.atualizar_perfil(usuario.id, payload)

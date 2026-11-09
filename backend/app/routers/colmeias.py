from fastapi import APIRouter, Depends, Response, status

from app.auth import Usuario, get_usuario_atual
from app.schemas.colmeia import Colmeia, ColmeiaCreate, ColmeiaUpdate
from app.schemas.monitoramento import Monitoramento
from app.services import colmeia_service, monitoramento_service


router = APIRouter(prefix="/colmeias", tags=["Colmeias"])


@router.get("", response_model=list[Colmeia])
def listar_colmeias(usuario: Usuario = Depends(get_usuario_atual)):
    return colmeia_service.listar_colmeias(usuario.id)


@router.post("", response_model=Colmeia, status_code=status.HTTP_201_CREATED)
def criar_colmeia(payload: ColmeiaCreate, usuario: Usuario = Depends(get_usuario_atual)):
    return colmeia_service.criar_colmeia(usuario.id, payload)


@router.get("/{colmeia_id}/monitoramentos", response_model=list[Monitoramento])
def listar_monitoramentos_da_colmeia(colmeia_id: str, usuario: Usuario = Depends(get_usuario_atual)):
    return monitoramento_service.listar_por_colmeia(usuario.id, colmeia_id)


@router.get("/{colmeia_id}", response_model=Colmeia)
def obter_colmeia(colmeia_id: str, usuario: Usuario = Depends(get_usuario_atual)):
    return colmeia_service.obter_colmeia(usuario.id, colmeia_id)


@router.put("/{colmeia_id}", response_model=Colmeia)
def atualizar_colmeia(colmeia_id: str, payload: ColmeiaUpdate, usuario: Usuario = Depends(get_usuario_atual)):
    return colmeia_service.atualizar_colmeia(usuario.id, colmeia_id, payload)


@router.delete("/{colmeia_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_colmeia(colmeia_id: str, usuario: Usuario = Depends(get_usuario_atual)):
    colmeia_service.excluir_colmeia(usuario.id, colmeia_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

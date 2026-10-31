from fastapi import APIRouter, Depends, Query, Response, status

from app.auth import Usuario, get_usuario_atual
from app.schemas.colmeia import Colmeia
from app.schemas.meliponario import Meliponario, MeliponarioCreate, MeliponarioUpdate
from app.services import colmeia_service, meliponario_service


router = APIRouter(prefix="/meliponarios", tags=["Meliponários"])


@router.get("", response_model=list[Meliponario])
def listar_meliponarios(
    busca: str | None = Query(default=None, max_length=80, description="Filtra por nome, cidade ou endereço."),
    com_alerta: bool = Query(default=False, description="Só meliponários com alertas abertos."),
    usuario: Usuario = Depends(get_usuario_atual),
):
    return meliponario_service.listar_meliponarios(usuario.id, busca, com_alerta)


@router.post("", response_model=Meliponario, status_code=status.HTTP_201_CREATED)
def criar_meliponario(payload: MeliponarioCreate, usuario: Usuario = Depends(get_usuario_atual)):
    return meliponario_service.criar_meliponario(usuario.id, payload)


@router.get("/{meliponario_id}", response_model=Meliponario)
def obter_meliponario(meliponario_id: str, usuario: Usuario = Depends(get_usuario_atual)):
    return meliponario_service.obter_meliponario(usuario.id, meliponario_id)


@router.get("/{meliponario_id}/colmeias", response_model=list[Colmeia])
def listar_colmeias_do_meliponario(meliponario_id: str, usuario: Usuario = Depends(get_usuario_atual)):
    meliponario_service.obter_meliponario(usuario.id, meliponario_id)
    return [c for c in colmeia_service.listar_colmeias(usuario.id) if c.get("meliponario_id") == meliponario_id]


@router.put("/{meliponario_id}", response_model=Meliponario)
def atualizar_meliponario(
    meliponario_id: str, payload: MeliponarioUpdate, usuario: Usuario = Depends(get_usuario_atual)
):
    return meliponario_service.atualizar_meliponario(usuario.id, meliponario_id, payload)


@router.delete("/{meliponario_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_meliponario(meliponario_id: str, usuario: Usuario = Depends(get_usuario_atual)):
    meliponario_service.excluir_meliponario(usuario.id, meliponario_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

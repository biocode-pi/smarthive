from fastapi import APIRouter, Response, status

from app.auth import CurrentUser
from app.schemas.colmeia import Colmeia, ColmeiaCreate, ColmeiaUpdate
from app.schemas.monitoramento import Monitoramento
from app.services import colmeia_service, monitoramento_service


router = APIRouter(prefix="/colmeias", tags=["Colmeias"])


@router.get("", response_model=list[Colmeia])
def listar_colmeias(current_user: CurrentUser):
    return colmeia_service.listar_colmeias(current_user)


@router.post("", response_model=Colmeia, status_code=status.HTTP_201_CREATED)
def criar_colmeia(payload: ColmeiaCreate, current_user: CurrentUser):
    return colmeia_service.criar_colmeia(payload, current_user)


@router.get("/{colmeia_id}/monitoramentos", response_model=list[Monitoramento])
def listar_monitoramentos_da_colmeia(colmeia_id: str, current_user: CurrentUser):
    return monitoramento_service.listar_por_colmeia(colmeia_id, current_user)


@router.get("/{colmeia_id}", response_model=Colmeia)
def obter_colmeia(colmeia_id: str, current_user: CurrentUser):
    return colmeia_service.obter_colmeia(colmeia_id, current_user)


@router.put("/{colmeia_id}", response_model=Colmeia)
def atualizar_colmeia(colmeia_id: str, payload: ColmeiaUpdate, current_user: CurrentUser):
    return colmeia_service.atualizar_colmeia(colmeia_id, payload, current_user)


@router.delete("/{colmeia_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_colmeia(colmeia_id: str, current_user: CurrentUser):
    colmeia_service.excluir_colmeia(colmeia_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

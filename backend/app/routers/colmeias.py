from fastapi import APIRouter, Response, status

from app.schemas.colmeia import Colmeia, ColmeiaCreate, ColmeiaUpdate
from app.schemas.monitoramento import Monitoramento
from app.services import colmeia_service, monitoramento_service


router = APIRouter(prefix="/colmeias", tags=["Colmeias"])


@router.get("", response_model=list[Colmeia])
def listar_colmeias():
    return colmeia_service.listar_colmeias()


@router.post("", response_model=Colmeia, status_code=status.HTTP_201_CREATED)
def criar_colmeia(payload: ColmeiaCreate):
    return colmeia_service.criar_colmeia(payload)


@router.get("/{colmeia_id}/monitoramentos", response_model=list[Monitoramento])
def listar_monitoramentos_da_colmeia(colmeia_id: str):
    return monitoramento_service.listar_por_colmeia(colmeia_id)


@router.get("/{colmeia_id}", response_model=Colmeia)
def obter_colmeia(colmeia_id: str):
    return colmeia_service.obter_colmeia(colmeia_id)


@router.put("/{colmeia_id}", response_model=Colmeia)
def atualizar_colmeia(colmeia_id: str, payload: ColmeiaUpdate):
    return colmeia_service.atualizar_colmeia(colmeia_id, payload)


@router.delete("/{colmeia_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_colmeia(colmeia_id: str):
    colmeia_service.excluir_colmeia(colmeia_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

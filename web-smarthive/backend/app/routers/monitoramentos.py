from datetime import datetime

from fastapi import APIRouter, File, Form, Response, UploadFile, status

from app.schemas.monitoramento import Monitoramento, MonitoramentoUpdate, OrigemMonitoramento
from app.services import monitoramento_service, storage_service


router = APIRouter(prefix="/monitoramentos", tags=["Monitoramentos"])


@router.get("", response_model=list[Monitoramento])
def listar_monitoramentos():
    return monitoramento_service.listar_monitoramentos()


@router.get("/{monitoramento_id}", response_model=Monitoramento)
def obter_monitoramento(monitoramento_id: str):
    return monitoramento_service.obter_monitoramento(monitoramento_id)


@router.post("", response_model=Monitoramento, status_code=status.HTTP_201_CREATED)
async def criar_monitoramento(
    colmeia_id: str = Form(...),
    data_hora: datetime | None = Form(default=None),
    origem: OrigemMonitoramento = Form(default=OrigemMonitoramento.manual),
    duracao_segundos: int | None = Form(default=None),
    movimentos_estimados: int | None = Form(default=None),
    abelhas_entrando: int | None = Form(default=None),
    abelhas_saindo: int | None = Form(default=None),
    fluxo_estimado: int | None = Form(default=None),
    temperatura_c: float | None = Form(default=None),
    umidade_percentual: float | None = Form(default=None),
    possivel_invasor: bool = Form(default=False),
    observacoes: str | None = Form(default=None),
    arquivo: UploadFile | None = File(default=None),
):
    midia_url = await storage_service.salvar_upload(arquivo)
    return monitoramento_service.criar_monitoramento(
        {
            "colmeia_id": colmeia_id,
            "data_hora": data_hora.isoformat() if data_hora else None,
            "origem": origem.value,
            "duracao_segundos": duracao_segundos,
            "movimentos_estimados": movimentos_estimados,
            "abelhas_entrando": abelhas_entrando,
            "abelhas_saindo": abelhas_saindo,
            "fluxo_estimado": fluxo_estimado,
            "temperatura_c": temperatura_c,
            "umidade_percentual": umidade_percentual,
            "possivel_invasor": possivel_invasor,
            "observacoes": observacoes,
            "midia_url": midia_url,
        }
    )


@router.put("/{monitoramento_id}", response_model=Monitoramento)
def atualizar_monitoramento(monitoramento_id: str, payload: MonitoramentoUpdate):
    return monitoramento_service.atualizar_monitoramento(monitoramento_id, payload)


@router.delete("/{monitoramento_id}", status_code=status.HTTP_204_NO_CONTENT)
def excluir_monitoramento(monitoramento_id: str):
    monitoramento_service.excluir_monitoramento(monitoramento_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


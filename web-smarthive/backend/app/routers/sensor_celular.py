from fastapi import APIRouter, File, Form, UploadFile, status

from app.auth import CurrentUser
from app.database import get_store
from app.schemas.sensor_celular import SensorCelularResposta
from app.services import monitoramento_service, storage_service


router = APIRouter(prefix="/sensor-celular", tags=["Sensor Celular"])


@router.post("/captura", response_model=SensorCelularResposta, status_code=status.HTTP_201_CREATED)
async def registrar_captura_sensor_celular(
    current_user: CurrentUser,
    colmeia_id: str = Form(...),
    duracao_segundos: int | None = Form(default=None),
    movimentos_estimados: int = Form(default=0),
    abelhas_entrando: int = Form(default=0),
    abelhas_saindo: int = Form(default=0),
    observacoes: str | None = Form(default=None),
    possivel_invasor: bool = Form(default=False),
    arquivo: UploadFile | None = File(default=None),
):
    midia_url = await storage_service.salvar_upload(arquivo)
    fluxo_estimado = abelhas_entrando + abelhas_saindo if abelhas_entrando or abelhas_saindo else movimentos_estimados

    monitoramento = monitoramento_service.criar_monitoramento(
        {
            "colmeia_id": colmeia_id,
            "origem": "sensor_celular",
            "duracao_segundos": duracao_segundos,
            "movimentos_estimados": movimentos_estimados,
            "abelhas_entrando": abelhas_entrando,
            "abelhas_saindo": abelhas_saindo,
            "fluxo_estimado": fluxo_estimado,
            "possivel_invasor": possivel_invasor,
            "observacoes": observacoes,
            "midia_url": midia_url,
        },
        current_user,
    )

    captura = get_store().create(
        "capturas_sensor_celular",
        {
            "colmeia_id": colmeia_id,
            "monitoramento_id": monitoramento["id"],
            "duracao_segundos": duracao_segundos,
            "movimentos_estimados": movimentos_estimados,
            "abelhas_entrando": abelhas_entrando,
            "abelhas_saindo": abelhas_saindo,
            "possivel_invasor": possivel_invasor,
            "observacoes": observacoes,
            "midia_url": midia_url,
        },
    )

    return {
        "monitoramento_id": monitoramento["id"],
        "captura_id": captura["id"],
        "mensagem": "Captura experimental registrada como monitoramento.",
    }

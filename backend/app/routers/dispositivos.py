import io

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, Response, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from PIL import Image

from app.auth import Usuario, get_usuario_atual
from app.schemas.dispositivo import CapturaDispositivoResposta, Dispositivo, DispositivoCreate, DispositivoCriado
from app.services import contagem_service, dispositivo_service, monitoramento_service, storage_service


router = APIRouter(tags=["Dispositivos"])


def dispositivo_atual(authorization: str | None = Header(default=None)) -> dict:
    return dispositivo_service.autenticar(authorization)


@router.get("/colmeias/{colmeia_id}/dispositivos", response_model=list[Dispositivo])
def listar_dispositivos(colmeia_id: str, usuario: Usuario = Depends(get_usuario_atual)):
    return dispositivo_service.listar(usuario.id, colmeia_id)


@router.post("/colmeias/{colmeia_id}/dispositivos", response_model=DispositivoCriado, status_code=status.HTTP_201_CREATED)
def criar_dispositivo(colmeia_id: str, payload: DispositivoCreate, usuario: Usuario = Depends(get_usuario_atual)):
    return dispositivo_service.criar(usuario.id, colmeia_id, payload.nome)


@router.delete("/dispositivos/{dispositivo_id}", status_code=status.HTTP_204_NO_CONTENT)
def revogar_dispositivo(dispositivo_id: str, usuario: Usuario = Depends(get_usuario_atual)):
    dispositivo_service.revogar(usuario.id, dispositivo_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _descricao(contagem: contagem_service.Contagem | None) -> str | None:
    if contagem is None:
        return None
    if contagem.abelhas == 0:
        return "Leitura automática: nenhuma abelha na imagem."
    texto = "1 abelha" if contagem.abelhas == 1 else f"{contagem.abelhas} abelhas"
    return f"Leitura automática: {texto} na imagem ({round(contagem.confianca * 100)}%)."


@router.post("/dispositivos/captura", response_model=CapturaDispositivoResposta, status_code=status.HTTP_201_CREATED)
async def receber_captura(
    foto: UploadFile = File(...),
    temperatura_c: float | None = Form(default=None, ge=-40, le=85),
    umidade_percentual: float | None = Form(default=None, ge=0, le=100),
    dispositivo: dict = Depends(dispositivo_atual),
):
    conteudo = await foto.read()
    try:
        with Image.open(io.BytesIO(conteudo)) as imagem:
            largura, altura = imagem.size
            imagem.verify()
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Envie uma foto JPEG ou PNG.") from exc
    if largura * altura > contagem_service.MAXIMO_DE_PIXELS:
        raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail="Foto com resolução acima de 4096 × 4096.")
    await foto.seek(0)

    usuario_id = dispositivo["usuario_id"]
    midia_url = await storage_service.salvar_upload(usuario_id, foto)
    contagem = await run_in_threadpool(contagem_service.contar, conteudo)
    abelhas = contagem.abelhas if contagem else None
    monitoramento = await run_in_threadpool(
        monitoramento_service.criar_monitoramento,
        usuario_id,
        {
            "colmeia_id": dispositivo["colmeia_id"],
            "origem": "iot_futuro",
            "temperatura_c": temperatura_c,
            "umidade_percentual": umidade_percentual,
            "movimentos_estimados": abelhas,
            "fluxo_estimado": abelhas,
            "observacoes": _descricao(contagem),
            "midia_url": midia_url,
        },
    )
    await run_in_threadpool(dispositivo_service.registrar_envio, dispositivo["id"])
    return {
        "monitoramento_id": monitoramento["id"],
        "abelhas": abelhas,
        "mensagem": "Captura registrada.",
    }

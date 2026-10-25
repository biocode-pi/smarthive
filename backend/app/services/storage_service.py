"""Armazenamento de imagens e videos das capturas.

Em producao (STORAGE_BACKEND=s3) os arquivos vao para um bucket S3 privado, com
chave prefixada pelo id do usuario. O banco guarda apenas a referencia "s3:<chave>"
e a leitura acontece por URL pre-assinada com validade curta. Credenciais AWS vem
da IAM Role da instancia, nunca do codigo ou do .env.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from app.config import get_settings
from app.utils.file_utils import ALLOWED_CONTENT_TYPES, safe_extension


S3_PREFIX = "s3:"
CHUNK_SIZE = 1024 * 1024


@lru_cache
def _s3_client():
    import boto3

    return boto3.client("s3", region_name=get_settings().aws_region)


async def _ler_com_limite(file: UploadFile, limite_bytes: int) -> bytes:
    partes: list[bytes] = []
    total = 0
    while chunk := await file.read(CHUNK_SIZE):
        total += len(chunk)
        if total > limite_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail=f"Arquivo maior que o limite de {limite_bytes // (1024 * 1024)} MB.",
            )
        partes.append(chunk)
    return b"".join(partes)


def _validar_tipo(file: UploadFile) -> str:
    extension = safe_extension(file.filename or "")
    content_type = (file.content_type or "").lower()
    if extension is None or ALLOWED_CONTENT_TYPES.get(extension) != content_type:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Tipo de arquivo nao permitido. Envie JPG, PNG, WEBP, MP4, MOV ou WEBM.",
        )
    return extension


async def salvar_upload(usuario_id: str, file: UploadFile | None) -> str | None:
    if file is None or not file.filename:
        return None

    settings = get_settings()
    extension = _validar_tipo(file)
    content = await _ler_com_limite(file, settings.max_upload_bytes)
    filename = f"{uuid4()}{extension}"

    if settings.storage_backend == "s3":
        key = f"usuarios/{usuario_id}/monitoramentos/{filename}"
        try:
            _s3_client().put_object(
                Bucket=settings.s3_bucket,
                Key=key,
                Body=content,
                ContentType=file.content_type,
                ServerSideEncryption="AES256",
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Falha ao enviar a midia para o armazenamento.",
            ) from exc
        return f"{S3_PREFIX}{key}"

    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    (Path(settings.upload_dir) / filename).write_bytes(content)
    return f"/uploads/{filename}"


def url_de_leitura(usuario_id: str, referencia: str | None) -> str | None:
    if not referencia or not referencia.startswith(S3_PREFIX):
        return referencia

    key = referencia[len(S3_PREFIX):]
    # Defesa extra: so assina objetos dentro da pasta do proprio usuario.
    if not key.startswith(f"usuarios/{usuario_id}/"):
        return None

    settings = get_settings()
    return _s3_client().generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.s3_bucket, "Key": key},
        ExpiresIn=settings.s3_url_expiracao_segundos,
    )

from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from app.config import get_settings
from app.database import SupabaseStore, get_store
from app.utils.file_utils import safe_extension


async def salvar_upload(file: UploadFile | None) -> str | None:
    if file is None or not file.filename:
        return None

    settings = get_settings()
    extension = safe_extension(file.filename)
    filename = f"{uuid4()}{extension}"
    content = await file.read()

    if settings.use_supabase:
        store = get_store()
        if isinstance(store, SupabaseStore):
            object_path = f"monitoramentos/{filename}"
            try:
                bucket = store.client.storage.from_(settings.supabase_storage_bucket)
                bucket.upload(
                    path=object_path,
                    file=content,
                    file_options={"content-type": file.content_type or "application/octet-stream"},
                )
                return bucket.get_public_url(object_path)
            except Exception as exc:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=(
                        "Falha ao enviar midia para o Supabase Storage. "
                        "Verifique SUPABASE_STORAGE_BUCKET, permissao da service role e se o bucket existe."
                    ),
                ) from exc

    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    destination = Path(settings.upload_dir) / filename
    destination.write_bytes(content)
    return f"/uploads/{filename}"

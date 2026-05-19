from __future__ import annotations

from typing import Annotated, Optional

import jwt
from fastapi import Depends, Header, HTTPException, status

from app.config import get_settings


def _decode_jwt(token: str) -> dict:
    settings = get_settings()
    if settings.supabase_jwt_secret:
        return jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_aud": False},
        )
    return jwt.decode(token, options={"verify_signature": False, "verify_aud": False})


def _extract_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cabecalho Authorization invalido. Use 'Bearer <token>'.",
        )
    return parts[1]


def get_optional_user_id(
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
) -> str | None:
    settings = get_settings()
    token = _extract_token(authorization)
    if not token:
        return None
    try:
        claims = _decode_jwt(token)
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sessao expirada.") from exc
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token invalido: {exc}",
        ) from exc
    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sem identificador de usuario.",
        )
    if settings.use_supabase and claims.get("aud") not in (None, "authenticated"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token com audience invalida.",
        )
    return user_id


def require_user_id(
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
) -> str:
    settings = get_settings()
    user_id = get_optional_user_id(authorization)
    if user_id:
        return user_id
    if settings.use_supabase:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticacao obrigatoria.",
        )
    return "local-dev"


CurrentUser = Annotated[Optional[str], Depends(get_optional_user_id)]
RequiredUser = Annotated[str, Depends(require_user_id)]

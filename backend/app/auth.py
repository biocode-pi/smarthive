"""Autenticacao via Amazon Cognito.

O frontend e o app mobile enviam o access token do Cognito no header
Authorization: Bearer <token>. Aqui validamos assinatura (JWKS do User Pool),
emissor, expiracao, tipo do token e client_id, e expomos o `sub` como id do usuario.
"""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import Settings, get_settings


bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class Usuario:
    id: str
    email: str | None = None


def _nao_autorizado(detalhe: str = "Token invalido ou ausente.") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detalhe,
        headers={"WWW-Authenticate": "Bearer"},
    )


@lru_cache
def _jwks_client(issuer: str) -> jwt.PyJWKClient:
    # O cliente guarda as chaves publicas em cache e so busca de novo quando aparece um "kid" novo.
    return jwt.PyJWKClient(f"{issuer}/.well-known/jwks.json", cache_keys=True)


def validar_token_cognito(token: str, settings: Settings) -> Usuario:
    try:
        signing_key = _jwks_client(settings.cognito_issuer).get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=settings.cognito_issuer,
            options={"require": ["exp", "iss", "sub", "token_use"]},
        )
    except jwt.PyJWTError as exc:
        raise _nao_autorizado() from exc

    # Access token do Cognito nao tem "aud"; o client_id vem em "client_id".
    if claims.get("token_use") != "access" or claims.get("client_id") != settings.cognito_app_client_id:
        raise _nao_autorizado()

    return Usuario(id=claims["sub"], email=claims.get("email") or claims.get("username"))


def get_usuario_atual(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    settings: Settings = Depends(get_settings),
) -> Usuario:
    if settings.auth_mode == "dev":
        return Usuario(id=settings.dev_user_id, email="dev@localhost")

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _nao_autorizado()
    return validar_token_cognito(credentials.credentials, settings)

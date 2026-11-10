from __future__ import annotations

from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool
from starlette.datastructures import Headers
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app import auth
from app.config import Settings, get_settings
from app.rate_limit import ROTAS_DE_UPLOAD


METODOS_COM_CORPO = {"POST", "PUT", "PATCH"}
MB = 1024 * 1024


def _muito_grande() -> HTTPException:
    return HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail="Requisição maior que o limite permitido.")


def _limite_em_bytes(scope: Scope, settings: Settings) -> int:
    caminho = scope["path"].removeprefix(settings.api_prefix)
    if scope["method"] == "POST" and caminho in ROTAS_DE_UPLOAD:
        return settings.max_upload_bytes + settings.margem_multipart_mb * MB
    return settings.max_corpo_mb * MB


def _autenticar(valor: str | None, settings: Settings) -> None:
    esquema, _, token = (valor or "").partition(" ")
    if esquema.lower() != "bearer" or not token:
        raise auth.nao_autorizado()
    auth.validar_token_cognito(token.strip(), settings)


def _content_length(headers: Headers) -> int | None:
    valor = headers.get("content-length", "")
    return int(valor) if valor.isascii() and valor.isdigit() else None


class LimiteDeCorpoMiddleware:

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope["method"] not in METODOS_COM_CORPO:
            await self.app(scope, receive, send)
            return

        settings = get_settings()
        headers = Headers(scope=scope)
        limite = _limite_em_bytes(scope, settings)
        try:
            if settings.auth_mode == "cognito":
                await run_in_threadpool(_autenticar, headers.get("authorization"), settings)
            tamanho = _content_length(headers)
            if tamanho is not None and tamanho > limite:
                raise _muito_grande()
        except HTTPException as exc:
            resposta = JSONResponse({"detail": exc.detail}, status_code=exc.status_code, headers=exc.headers)
            await resposta(scope, receive, send)
            return

        recebido = 0

        async def receber() -> Message:
            nonlocal recebido
            mensagem = await receive()
            if mensagem["type"] == "http.request":
                recebido += len(mensagem.get("body", b""))
                if recebido > limite:
                    raise _muito_grande()
            return mensagem

        await self.app(scope, receber, send)

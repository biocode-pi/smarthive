"""Limite de requisicoes por IP (janela fixa de 60 s, em memoria).

A API roda em um unico processo, entao um contador em memoria basta. Uploads tem
limite proprio, mais baixo, por serem as requisicoes mais caras (disco, S3, banco).

IP do cliente: em producao a requisicao passa por CloudFront e Caddy. O cliente pode
enviar um X-Forwarded-For falso, mas o CloudFront acrescenta o IP real ao final e o
Caddy acrescenta o IP do CloudFront depois dele. Com TRUSTED_PROXY_HOPS=2, usamos o
segundo endereco a partir do fim, que e o que o CloudFront anotou.
"""

from __future__ import annotations

import math
import threading
import time

from fastapi import Request
from fastapi.responses import JSONResponse

from app.config import Settings

JANELA_SEGUNDOS = 60
ROTAS_DE_UPLOAD = ("/monitoramentos", "/sensor-celular/captura")


def ip_do_cliente(request: Request, trusted_proxy_hops: int) -> str:
    if trusted_proxy_hops > 0:
        cadeia = [ip.strip() for ip in request.headers.get("x-forwarded-for", "").split(",") if ip.strip()]
        if len(cadeia) >= trusted_proxy_hops:
            return cadeia[-trusted_proxy_hops]
    return request.client.host if request.client else "desconhecido"


class LimitadorDeRequisicoes:
    def __init__(self) -> None:
        self._contadores: dict[tuple[str, str, int], int] = {}
        self._lock = threading.Lock()

    def reset(self) -> None:
        with self._lock:
            self._contadores.clear()

    def registrar(self, chave: str, grupo: str, limite: int) -> int | None:
        """Conta a requisicao; devolve os segundos de espera se o limite foi excedido."""
        agora = time.time()
        janela = int(agora // JANELA_SEGUNDOS)
        with self._lock:
            if len(self._contadores) > 10_000:
                self._contadores = {k: v for k, v in self._contadores.items() if k[2] == janela}
            k = (chave, grupo, janela)
            self._contadores[k] = self._contadores.get(k, 0) + 1
            if self._contadores[k] > limite:
                return max(1, math.ceil((janela + 1) * JANELA_SEGUNDOS - agora))
        return None


limitador = LimitadorDeRequisicoes()


def grupo_e_limite(request: Request, settings: Settings) -> tuple[str, int] | None:
    caminho = request.url.path.removeprefix(settings.api_prefix)
    if request.method == "OPTIONS" or caminho.startswith("/health") or not caminho.startswith("/"):
        return None
    if request.method == "POST" and caminho in ROTAS_DE_UPLOAD:
        return "upload", settings.rate_limit_upload_por_minuto
    return "geral", settings.rate_limit_por_minuto


async def aplicar_limite(request: Request, settings: Settings) -> JSONResponse | None:
    regra = grupo_e_limite(request, settings)
    if regra is None:
        return None
    grupo, limite = regra
    espera = limitador.registrar(ip_do_cliente(request, settings.trusted_proxy_hops), grupo, limite)
    if espera is None:
        return None
    return JSONResponse(
        status_code=429,
        content={"detail": "Muitas requisicoes. Aguarde alguns segundos e tente novamente."},
        headers={"Retry-After": str(espera)},
    )

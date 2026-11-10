from __future__ import annotations

import ipaddress
import math
import threading
import time

from fastapi import Request
from fastapi.responses import JSONResponse

from app.config import Settings

JANELA_SEGUNDOS = 60
ROTAS_DE_UPLOAD = ("/monitoramentos", "/sensor-celular/captura")


MAX_CHAVES_POR_JANELA = 20_000
CHAVE_EXCEDENTE = "__excedente__"
FATOR_EXCEDENTE = 10


def normalizar_ip(ip: str) -> str:
    try:
        endereco = ipaddress.ip_address(ip)
    except ValueError:
        return "__invalido__"
    if endereco.version == 4:
        return str(endereco)
    if endereco.ipv4_mapped is not None:
        return str(endereco.ipv4_mapped)
    return str(ipaddress.ip_network(f"{endereco}/64", strict=False))


def ip_do_cliente(request: Request, trusted_proxy_hops: int) -> str:
    if trusted_proxy_hops > 0:
        cadeia = [ip.strip() for ip in request.headers.get("x-forwarded-for", "").split(",") if ip.strip()]
        if len(cadeia) >= trusted_proxy_hops:
            return normalizar_ip(cadeia[-trusted_proxy_hops])
    return normalizar_ip(request.client.host) if request.client else "desconhecido"


class LimitadorDeRequisicoes:
    def __init__(self, max_chaves: int = MAX_CHAVES_POR_JANELA) -> None:
        self._contadores: dict[tuple[str, str], int] = {}
        self._janela = -1
        self._max_chaves = max_chaves
        self._lock = threading.Lock()

    def reset(self) -> None:
        with self._lock:
            self._contadores.clear()
            self._janela = -1

    def registrar(self, chave: str, grupo: str, limite: int) -> int | None:
        agora = time.time()
        janela = int(agora // JANELA_SEGUNDOS)
        espera = max(1, math.ceil((janela + 1) * JANELA_SEGUNDOS - agora))
        with self._lock:
            if janela != self._janela:
                self._contadores = {}
                self._janela = janela
            k = (chave, grupo)
            if k not in self._contadores and len(self._contadores) >= self._max_chaves:
                k = (CHAVE_EXCEDENTE, grupo)
                limite *= FATOR_EXCEDENTE
            self._contadores[k] = self._contadores.get(k, 0) + 1
            if self._contadores[k] > limite:
                return espera
        return None


limitador = LimitadorDeRequisicoes()


def grupo_e_limite(request: Request, settings: Settings) -> tuple[str, int] | None:
    caminho = request.url.path.removeprefix(settings.api_prefix)
    metodo = request.method
    if metodo == "OPTIONS" or not caminho.startswith("/"):
        return None
    if caminho.startswith("/health"):
        return "publico", settings.rate_limit_publico_por_minuto
    if metodo == "POST" and caminho in ROTAS_DE_UPLOAD:
        return "upload", settings.rate_limit_upload_por_minuto
    if metodo == "DELETE" and caminho == "/conta":
        return "conta", settings.rate_limit_conta_por_minuto
    if caminho == "/dashboard/resumo":
        return "dashboard", settings.rate_limit_dashboard_por_minuto
    if metodo in ("POST", "PUT", "PATCH", "DELETE"):
        return "escrita", settings.rate_limit_escrita_por_minuto
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
        content={"detail": "Muitas requisições. Aguarde alguns segundos e tente novamente."},
        headers={"Retry-After": str(espera)},
    )

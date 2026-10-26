"""Limite de requisicoes por IP (janela fixa de 60 s, em memoria).

A API roda em um unico processo, entao um contador em memoria basta. Uploads tem
limite proprio, mais baixo, por serem as requisicoes mais caras (disco, S3, banco).

IP do cliente: em producao a requisicao passa por CloudFront e Caddy. O cliente pode
enviar um X-Forwarded-For falso, mas o CloudFront acrescenta o IP real ao final e o
Caddy acrescenta o IP do CloudFront depois dele. Com TRUSTED_PROXY_HOPS=2, usamos o
segundo endereco a partir do fim, que e o que o CloudFront anotou.
"""

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


# Teto de chaves distintas por janela, para a memoria nao crescer sem limite. Acima dele,
# IPs novos dividem um balde de excedente com limite proprio, em vez de serem recusados:
# assim quem enche o teto (ex.: varrendo um /48 IPv6) nao bloqueia todos os outros clientes.
MAX_CHAVES_POR_JANELA = 20_000
CHAVE_EXCEDENTE = "__excedente__"
FATOR_EXCEDENTE = 10


def normalizar_ip(ip: str) -> str:
    """IPv6 vira o prefixo /64: um so cliente costuma ter um /64 inteiro e poderia
    trocar de endereco a cada requisicao para escapar do limite."""
    try:
        endereco = ipaddress.ip_address(ip)
    except ValueError:
        return "__invalido__"  # nunca usar texto arbitrario como chave
    if endereco.version == 4:
        return str(endereco)
    if endereco.ipv4_mapped is not None:  # ::ffff:1.2.3.4 conta como o IPv4
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
        """Conta a requisicao; devolve os segundos de espera se o limite foi excedido."""
        agora = time.time()
        janela = int(agora // JANELA_SEGUNDOS)
        espera = max(1, math.ceil((janela + 1) * JANELA_SEGUNDOS - agora))
        with self._lock:
            # Ao virar a janela, descarta tudo de uma vez (O(1) amortizado, sem recopiar a cada requisicao).
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
        content={"detail": "Muitas requisições. Aguarde alguns segundos e tente novamente."},
        headers={"Retry-After": str(espera)},
    )

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.rate_limit import aplicar_limite
from app.routers import alertas, colmeias, dashboard, health, monitoramentos, sensor_celular


settings = get_settings()
logger = logging.getLogger("smarthive")

if settings.auth_mode == "dev":
    logger.warning("AUTH_MODE=dev: autenticacao desativada, todas as requisicoes usam '%s'.", settings.dev_user_id)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="API do SmartHive para monitoramento de colmeias de abelhas nativas.",
    # Documentacao interativa so fora de producao, para nao expor o mapa da API.
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def seguranca_http(request: Request, call_next):
    # Limite de requisicoes antes de tudo; depois cabecalhos de seguranca em toda resposta.
    response = await aplicar_limite(request, settings) or await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Cache-Control"] = "no-store"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# Uploads locais so existem no modo de desenvolvimento; com S3 a leitura e por URL pre-assinada.
if settings.storage_backend == "local":
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

app.include_router(colmeias.router, prefix=settings.api_prefix)
app.include_router(monitoramentos.router, prefix=settings.api_prefix)
app.include_router(sensor_celular.router, prefix=settings.api_prefix)
app.include_router(alertas.router, prefix=settings.api_prefix)
app.include_router(dashboard.router, prefix=settings.api_prefix)
app.include_router(health.router, prefix=settings.api_prefix)


@app.get("/")
def healthcheck():
    return {"name": "SmartHive", "status": "online"}

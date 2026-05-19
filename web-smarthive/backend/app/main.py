from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.routers import alertas, colmeias, dashboard, health, monitoramentos, sensor_celular


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "API do SmartHive para monitoramento de colmeias de abelhas nativas, "
        "com MVP academico preparado para evoluir para IoT e IA."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    return {
        "name": "SmartHive",
        "status": "online",
        "message": "Base academica para monitoramento inteligente de colmeias nativas.",
    }

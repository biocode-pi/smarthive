from functools import lru_cache
import os
from pathlib import Path
from typing import List, Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "SmartHive API"
    app_version: str = "0.2.0"
    environment: str = "development"

    api_prefix: str = Field(default_factory=lambda: "" if os.getenv("VERCEL") else "/api")
    frontend_url: str = "http://localhost:5173"
    cors_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        description="Lista separada por virgulas com origens permitidas.",
    )

    # Autenticacao: "cognito" valida o JWT do Amazon Cognito; "dev" usa um usuario fixo
    # e so e permitido fora de producao.
    auth_mode: Literal["cognito", "dev"] = "dev"
    dev_user_id: str = "dev-local"
    aws_region: str = "us-east-1"
    cognito_user_pool_id: str | None = None
    cognito_app_client_id: str | None = None

    # Banco: com DATABASE_URL usa PostgreSQL (RDS); sem ele, JSON local do MVP.
    database_url: str | None = None
    database_sslmode: str = "require"

    # Storage: "s3" grava em bucket privado e devolve URLs pre-assinadas; "local" grava em disco.
    storage_backend: Literal["local", "s3"] = "local"
    s3_bucket: str | None = None
    s3_url_expiracao_segundos: int = 3600
    max_upload_mb: int = 50

    upload_dir: Path = Path(__file__).resolve().parent / "uploads"
    local_data_file: Path = Path(__file__).resolve().parent / "data" / "smarthive.local.json"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def validar_configuracao(self) -> "Settings":
        if self.is_production and self.auth_mode != "cognito":
            raise ValueError("Em producao AUTH_MODE deve ser 'cognito'.")
        if self.auth_mode == "cognito" and not (self.cognito_user_pool_id and self.cognito_app_client_id):
            raise ValueError("AUTH_MODE=cognito exige COGNITO_USER_POOL_ID e COGNITO_APP_CLIENT_ID.")
        if self.storage_backend == "s3" and not self.s3_bucket:
            raise ValueError("STORAGE_BACKEND=s3 exige S3_BUCKET.")
        return self

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in {"production", "producao", "prod"}

    @property
    def allowed_origins(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def cognito_issuer(self) -> str:
        return f"https://cognito-idp.{self.aws_region}.amazonaws.com/{self.cognito_user_pool_id}"

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()

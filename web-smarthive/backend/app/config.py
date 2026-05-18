from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "SmartHive API"
    app_version: str = "0.1.0"
    environment: str = "development"

    api_prefix: str = "/api"
    frontend_url: str = "http://localhost:5173"
    cors_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        description="Lista separada por virgulas com origens permitidas.",
    )

    supabase_url: str | None = None
    supabase_key: str | None = None
    supabase_service_role_key: str | None = None
    supabase_backend_secret: str | None = None
    supabase_jwt_secret: str | None = None
    supabase_storage_bucket: str = "smarthive-capturas"
    database_url: str | None = None
    use_supabase: bool = False

    upload_dir: Path = Path(__file__).resolve().parent / "uploads"
    local_data_file: Path = Path(__file__).resolve().parent / "data" / "smarthive.local.json"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def allowed_origins(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def supabase_access_key(self) -> str | None:
        return self.supabase_service_role_key or self.supabase_key


@lru_cache
def get_settings() -> Settings:
    return Settings()

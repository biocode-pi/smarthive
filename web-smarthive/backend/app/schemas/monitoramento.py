from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class OrigemMonitoramento(str, Enum):
    manual = "manual"
    sensor_celular = "sensor_celular"
    iot_futuro = "iot_futuro"


class MonitoramentoBase(BaseModel):
    colmeia_id: str
    data_hora: datetime | None = None
    origem: OrigemMonitoramento = OrigemMonitoramento.manual
    duracao_segundos: int | None = Field(default=None, ge=0)
    movimentos_estimados: int | None = Field(default=None, ge=0)
    abelhas_entrando: int | None = Field(default=None, ge=0)
    abelhas_saindo: int | None = Field(default=None, ge=0)
    fluxo_estimado: int | None = Field(default=None, ge=0)
    temperatura_c: float | None = None
    umidade_percentual: float | None = None
    possivel_invasor: bool = False
    observacoes: str | None = None
    midia_url: str | None = None


class MonitoramentoCreate(MonitoramentoBase):
    pass


class MonitoramentoUpdate(BaseModel):
    data_hora: datetime | None = None
    origem: OrigemMonitoramento | None = None
    duracao_segundos: int | None = Field(default=None, ge=0)
    movimentos_estimados: int | None = Field(default=None, ge=0)
    abelhas_entrando: int | None = Field(default=None, ge=0)
    abelhas_saindo: int | None = Field(default=None, ge=0)
    fluxo_estimado: int | None = Field(default=None, ge=0)
    temperatura_c: float | None = None
    umidade_percentual: float | None = None
    possivel_invasor: bool | None = None
    observacoes: str | None = None
    midia_url: str | None = None


class Monitoramento(MonitoramentoBase):
    id: str
    analise_experimental: dict[str, Any] | None = None
    criado_em: datetime
    atualizado_em: datetime | None = None


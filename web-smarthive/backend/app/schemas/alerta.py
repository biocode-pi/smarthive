from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class SeveridadeAlerta(str, Enum):
    baixa = "baixa"
    media = "media"
    alta = "alta"


class TipoAlerta(str, Enum):
    observacao = "observacao"
    possivel_invasor = "possivel_invasor"
    baixa_atividade = "baixa_atividade"
    sistema = "sistema"


class AlertaBase(BaseModel):
    colmeia_id: str | None = None
    monitoramento_id: str | None = None
    tipo: TipoAlerta = TipoAlerta.observacao
    severidade: SeveridadeAlerta = SeveridadeAlerta.baixa
    titulo: str = Field(..., min_length=3)
    mensagem: str | None = None
    resolvido: bool = False


class AlertaCreate(AlertaBase):
    pass


class Alerta(AlertaBase):
    id: str
    criado_em: datetime
    resolvido_em: datetime | None = None


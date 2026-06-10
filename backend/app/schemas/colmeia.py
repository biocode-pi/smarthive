from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, Field


class StatusColmeia(str, Enum):
    ativa = "ativa"
    observacao = "observacao"
    risco = "risco"
    inativa = "inativa"


class ColmeiaBase(BaseModel):
    nome: str = Field(..., min_length=2, examples=["Colmeia Jatai - Campus"])
    codigo: str | None = Field(default=None, examples=["JAT-001"])
    especie: str = Field(..., examples=["Jatai"])
    localizacao: str | None = Field(default=None, examples=["Horto experimental"])
    descricao: str | None = None
    status: StatusColmeia = StatusColmeia.ativa
    instalada_em: date | None = None


class ColmeiaCreate(ColmeiaBase):
    pass


class ColmeiaUpdate(BaseModel):
    nome: str | None = None
    codigo: str | None = None
    especie: str | None = None
    localizacao: str | None = None
    descricao: str | None = None
    status: StatusColmeia | None = None
    instalada_em: date | None = None


class Colmeia(ColmeiaBase):
    id: str
    criado_em: datetime
    atualizado_em: datetime | None = None


from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, Field, field_validator


class StatusColmeia(str, Enum):
    ativa = "ativa"
    observacao = "observacao"
    risco = "risco"
    inativa = "inativa"


def _limpar_codigo(valor: str | None) -> str | None:
    return (valor.strip() or None) if valor is not None else None


class ColmeiaBase(BaseModel):
    nome: str = Field(..., min_length=2, examples=["Colmeia Jatai - Campus"])
    codigo: str | None = Field(default=None, examples=["JAT-001"])
    especie: str = Field(..., examples=["Jatai"])
    localizacao: str | None = Field(default=None, examples=["Horto experimental"])
    descricao: str | None = None
    status: StatusColmeia = StatusColmeia.ativa
    instalada_em: date | None = None
    meliponario_id: str | None = None

    _codigo_limpo = field_validator("codigo")(_limpar_codigo)


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
    meliponario_id: str | None = None

    _codigo_limpo = field_validator("codigo")(_limpar_codigo)


class Colmeia(ColmeiaBase):
    id: str
    criado_em: datetime
    atualizado_em: datetime | None = None


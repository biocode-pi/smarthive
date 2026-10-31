from datetime import datetime

from pydantic import BaseModel, Field


class MeliponarioBase(BaseModel):
    nome: str = Field(..., min_length=2, max_length=80, examples=["Meliponário do Horto"])
    endereco: str | None = Field(default=None, max_length=160, examples=["Rua Guará, 1385"])
    cidade: str | None = Field(default=None, max_length=80, examples=["Jacupiranga"])
    uf: str | None = Field(default=None, min_length=2, max_length=2, examples=["SP"])
    descricao: str | None = Field(default=None, max_length=500)


class MeliponarioCreate(MeliponarioBase):
    pass


class MeliponarioUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=2, max_length=80)
    endereco: str | None = Field(default=None, max_length=160)
    cidade: str | None = Field(default=None, max_length=80)
    uf: str | None = Field(default=None, min_length=2, max_length=2)
    descricao: str | None = Field(default=None, max_length=500)


class Meliponario(MeliponarioBase):
    id: str
    criado_em: datetime
    atualizado_em: datetime | None = None
    # Agregados calculados na listagem (nao ficam no banco).
    total_colmeias: int = 0
    alertas_abertos: int = 0

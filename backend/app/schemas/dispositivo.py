from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class DispositivoCreate(BaseModel):
    nome: str = Field(..., min_length=2, max_length=60, examples=["K10 da entrada"])

    @field_validator("nome")
    @classmethod
    def limpar_nome(cls, valor: str) -> str:
        valor = valor.strip()
        if len(valor) < 2:
            raise ValueError("Informe um nome com pelo menos 2 caracteres.")
        return valor


class Dispositivo(BaseModel):
    id: str
    colmeia_id: str
    nome: str
    criado_em: datetime
    ultimo_envio_em: datetime | None = None
    revogado_em: datetime | None = None


class DispositivoCriado(Dispositivo):
    chave: str


class CapturaDispositivoResposta(BaseModel):
    monitoramento_id: str
    abelhas: int | None
    invasor: str | None = None
    mensagem: str

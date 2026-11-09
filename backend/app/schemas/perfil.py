import re
from datetime import datetime

from pydantic import BaseModel, Field, field_validator


def normalizar_telefone(valor: str | None) -> str | None:
    """Aceita formatos como "(11) 91234-5678" e guarda so os digitos (DDD + numero)."""
    if valor is None or not valor.strip():
        return None
    digitos = re.sub(r"\D", "", valor)
    if digitos.startswith("55") and len(digitos) in (12, 13):
        digitos = digitos[2:]
    if len(digitos) not in (10, 11):
        raise ValueError("Informe o telefone com DDD, por exemplo (11) 91234-5678.")
    return digitos


class PerfilUpdate(BaseModel):
    # Campo omitido = nao altera; telefone null/"" = remove o telefone.
    telefone: str | None = Field(default=None, max_length=20)
    notificacoes_email: bool | None = None

    @field_validator("telefone")
    @classmethod
    def validar_telefone(cls, valor: str | None) -> str | None:
        return normalizar_telefone(valor)


class Perfil(BaseModel):
    telefone: str | None = None
    notificacoes_email: bool = False
    # Registro do consentimento (LGPD): quando foi dado e quando foi revogado.
    consentimento_em: datetime | None = None
    revogado_em: datetime | None = None
    atualizado_em: datetime | None = None

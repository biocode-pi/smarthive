from pydantic import BaseModel, Field


class SensorCelularCaptura(BaseModel):
    colmeia_id: str
    duracao_segundos: int = Field(..., ge=1)
    movimentos_estimados: int = Field(default=0, ge=0)
    abelhas_entrando: int = Field(default=0, ge=0)
    abelhas_saindo: int = Field(default=0, ge=0)
    observacoes: str | None = None
    possivel_invasor: bool = False


class SensorCelularResposta(BaseModel):
    monitoramento_id: str
    captura_id: str
    mensagem: str


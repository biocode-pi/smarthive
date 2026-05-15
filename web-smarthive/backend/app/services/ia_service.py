from __future__ import annotations

from typing import Any


def analisar_fluxo_experimental(
    movimentos_estimados: int | None,
    abelhas_entrando: int | None,
    abelhas_saindo: int | None,
) -> dict[str, Any]:
    """Analise heuristica do fluxo.

    Placeholder para futura IA com OpenCV, YOLO, TensorFlow ou PyTorch. Nesta
    fase academica, a funcao apenas interpreta os numeros informados pelo
    usuario/celular para manter a arquitetura preparada.
    """

    movimentos = movimentos_estimados or 0
    entrando = abelhas_entrando or 0
    saindo = abelhas_saindo or 0
    fluxo_total = entrando + saindo if entrando or saindo else movimentos

    if fluxo_total >= 80:
        nivel = "alto"
    elif fluxo_total >= 25:
        nivel = "moderado"
    elif fluxo_total > 0:
        nivel = "baixo"
    else:
        nivel = "sem_movimento"

    return {
        "nivel_atividade": nivel,
        "fluxo_total": fluxo_total,
        "saldo_fluxo": entrando - saindo,
        "observacao": "Analise experimental sem modelo de IA real nesta versao.",
    }


def detectar_possivel_invasor(possivel_invasor_manual: bool, observacoes: str | None = None) -> bool:
    """Detecta risco inicial de invasor por regra simples.

    Futuramente esta funcao pode receber frames de video e usar deteccao de
    objetos para identificar formigas, forideos, aranhas ou outras ameacas.
    """

    if possivel_invasor_manual:
        return True
    texto = (observacoes or "").lower()
    palavras_chave = ("invasor", "formiga", "forideo", "aranha", "mosca", "ameaca", "ataque")
    return any(palavra in texto for palavra in palavras_chave)


def classificar_status_colmeia(
    fluxo_estimado: int | None,
    possivel_invasor: bool,
    status_atual: str = "ativa",
) -> str:
    """Classifica status operacional da colmeia com heuristica inicial.

    Em uma evolucao de IA/IoT, esta etapa podera combinar series temporais,
    temperatura, umidade, audio, visao computacional e modelos embarcados.
    """

    if possivel_invasor:
        return "risco"
    if fluxo_estimado is not None and fluxo_estimado <= 3:
        return "observacao"
    if status_atual == "inativa":
        return "inativa"
    return "ativa"

from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from statistics import mean
from typing import Any, Iterable

from fastapi import APIRouter

from app.auth import CurrentUser
from app.services import alerta_service, colmeia_service, monitoramento_service


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


JANELA_DIAS = 14
DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"]


def _parse_dt(value: Any) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    try:
        text = str(value).replace("Z", "+00:00")
        dt = datetime.fromisoformat(text)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def _serie_diaria(monitoramentos: list[dict], janela_dias: int = JANELA_DIAS) -> list[dict]:
    hoje = datetime.now(timezone.utc).date()
    inicio = hoje - timedelta(days=janela_dias - 1)
    base = {inicio + timedelta(days=i): {"entradas": 0, "saidas": 0, "movimentos": 0, "invasores": 0}
            for i in range(janela_dias)}
    for item in monitoramentos:
        dt = _parse_dt(item.get("data_hora") or item.get("criado_em"))
        if not dt:
            continue
        dia = dt.astimezone(timezone.utc).date()
        if dia < inicio or dia > hoje:
            continue
        bucket = base[dia]
        bucket["entradas"] += item.get("abelhas_entrando") or 0
        bucket["saidas"] += item.get("abelhas_saindo") or 0
        bucket["movimentos"] += item.get("movimentos_estimados") or item.get("fluxo_estimado") or 0
        if item.get("possivel_invasor"):
            bucket["invasores"] += 1
    return [
        {
            "data": dia.isoformat(),
            "rotulo": f"{dia.day:02d}/{dia.month:02d}",
            **valores,
            "fluxo": valores["entradas"] + valores["saidas"],
        }
        for dia, valores in base.items()
    ]


def _distribuicao(items: Iterable[dict], chave: str, valores_default: list[str]) -> list[dict]:
    contagem = Counter(item.get(chave) or "desconhecido" for item in items)
    for valor in valores_default:
        contagem.setdefault(valor, 0)
    return [{"categoria": categoria, "total": total} for categoria, total in contagem.most_common()]


def _mapa_calor(monitoramentos: list[dict]) -> list[dict]:
    grid: dict[tuple[int, int], int] = defaultdict(int)
    for item in monitoramentos:
        dt = _parse_dt(item.get("data_hora") or item.get("criado_em"))
        if not dt:
            continue
        local = dt.astimezone(timezone.utc)
        grid[(local.weekday(), local.hour)] += 1
    return [
        {
            "dia_indice": dia,
            "dia": DIAS_SEMANA[(dia + 1) % 7],
            "hora": hora,
            "total": grid.get((dia, hora), 0),
        }
        for dia in range(7)
        for hora in range(24)
    ]


def _top_colmeias(colmeias: list[dict], monitoramentos: list[dict], limite: int = 5) -> list[dict]:
    por_colmeia: dict[str, list[dict]] = defaultdict(list)
    for item in monitoramentos:
        if item.get("colmeia_id"):
            por_colmeia[item["colmeia_id"]].append(item)

    enriquecidos: list[dict] = []
    for colmeia in colmeias:
        registros = por_colmeia.get(colmeia["id"], [])
        fluxo = sum((m.get("abelhas_entrando") or 0) + (m.get("abelhas_saindo") or 0) for m in registros)
        movimentos = sum(m.get("movimentos_estimados") or 0 for m in registros)
        ultimo = max(
            (_parse_dt(m.get("data_hora") or m.get("criado_em")) for m in registros),
            default=None,
        )
        enriquecidos.append(
            {
                "id": colmeia["id"],
                "nome": colmeia.get("nome", "Sem nome"),
                "especie": colmeia.get("especie", ""),
                "status": colmeia.get("status", "ativa"),
                "monitoramentos": len(registros),
                "fluxo": fluxo,
                "movimentos": movimentos,
                "ultima_atividade": ultimo.isoformat() if ultimo else None,
            }
        )
    enriquecidos.sort(key=lambda item: (item["fluxo"], item["movimentos"]), reverse=True)
    return enriquecidos[:limite]


def _perfil_teia(colmeias: list[dict], monitoramentos: list[dict], alertas: list[dict]) -> list[dict]:
    total_colmeias = max(len(colmeias), 1)
    ativas = sum(1 for c in colmeias if c.get("status") == "ativa")
    em_risco = sum(1 for c in colmeias if c.get("status") == "risco")
    alertas_abertos = sum(1 for a in alertas if not a.get("resolvido"))
    invasores = sum(1 for m in monitoramentos if m.get("possivel_invasor"))
    invasoes_score = max(0.0, 100 - invasores * 25)

    media_fluxo = (
        mean(
            ((m.get("abelhas_entrando") or 0) + (m.get("abelhas_saindo") or 0))
            for m in monitoramentos
        )
        if monitoramentos
        else 0
    )

    saldo = (
        mean((m.get("abelhas_entrando") or 0) - (m.get("abelhas_saindo") or 0) for m in monitoramentos)
        if monitoramentos
        else 0
    )
    equilibrio = max(0.0, 100 - min(abs(saldo) * 10, 100))

    cobertura = sum(1 for c in colmeias if c.get("id") in {m.get("colmeia_id") for m in monitoramentos})
    cobertura_score = (cobertura / total_colmeias) * 100

    saude_score = (ativas - em_risco) / total_colmeias * 100
    saude_score = max(0.0, min(saude_score, 100))

    alertas_score = max(0.0, 100 - alertas_abertos * 20)
    fluxo_score = min(media_fluxo * 2, 100)

    return [
        {"metrica": "Saude", "valor": round(saude_score, 1)},
        {"metrica": "Fluxo", "valor": round(fluxo_score, 1)},
        {"metrica": "Equilibrio", "valor": round(equilibrio, 1)},
        {"metrica": "Cobertura", "valor": round(cobertura_score, 1)},
        {"metrica": "Sem invasores", "valor": round(invasoes_score, 1)},
        {"metrica": "Sem alertas", "valor": round(alertas_score, 1)},
    ]


@router.get("/resumo")
def obter_resumo(current_user: CurrentUser):
    colmeias = colmeia_service.listar_colmeias(current_user)
    monitoramentos = monitoramento_service.listar_monitoramentos(current_user)
    alertas = alerta_service.listar_alertas(current_user)

    fluxo_acumulado = sum((m.get("abelhas_entrando") or 0) + (m.get("abelhas_saindo") or 0) for m in monitoramentos)
    movimentos_acumulados = sum(m.get("movimentos_estimados") or 0 for m in monitoramentos)
    entradas = sum(m.get("abelhas_entrando") or 0 for m in monitoramentos)
    saidas = sum(m.get("abelhas_saindo") or 0 for m in monitoramentos)

    return {
        "total_colmeias": len(colmeias),
        "colmeias_ativas": len([c for c in colmeias if c.get("status") == "ativa"]),
        "colmeias_em_observacao": len([c for c in colmeias if c.get("status") == "observacao"]),
        "colmeias_em_risco": len([c for c in colmeias if c.get("status") == "risco"]),
        "monitoramentos_realizados": len(monitoramentos),
        "alertas_abertos": len([a for a in alertas if not a.get("resolvido")]),
        "fluxo_acumulado": fluxo_acumulado,
        "movimentos_acumulados": movimentos_acumulados,
        "entradas": entradas,
        "saidas": saidas,
        "ultimos_monitoramentos": monitoramentos[:5],
        "alertas_recentes": alertas[:5],
        "sensor_celular": {
            "ativo": True,
            "descricao": "Nesta fase, o celular funciona como sensor visual experimental antes do IoT dedicado.",
        },
        "serie_diaria": _serie_diaria(monitoramentos),
        "distribuicao_status": _distribuicao(colmeias, "status", ["ativa", "observacao", "risco", "inativa"]),
        "distribuicao_origem": _distribuicao(monitoramentos, "origem", ["manual", "sensor_celular", "iot_futuro"]),
        "distribuicao_severidade": _distribuicao(alertas, "severidade", ["baixa", "media", "alta"]),
        "perfil_teia": _perfil_teia(colmeias, monitoramentos, alertas),
        "mapa_calor": _mapa_calor(monitoramentos),
        "top_colmeias": _top_colmeias(colmeias, monitoramentos),
    }

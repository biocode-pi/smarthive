from __future__ import annotations

import io
import logging
import threading
from dataclasses import dataclass

import numpy as np
from PIL import Image

from app.config import get_settings


TAMANHO = 640
CONFIANCA_MINIMA = 0.25
IOU_MAXIMO = 0.45
MAXIMO_DE_PIXELS = 4096 * 4096
TAMANHO_CLASSIFICADOR = 224
CLASSES_DE_ARANHA = range(72, 78)
CONFIANCA_ARANHA = 0.7
CONFIANCA_REGIAO_ARANHA = 0.4
MEDIA = np.array([0.485, 0.456, 0.406], dtype=np.float32)
DESVIO = np.array([0.229, 0.224, 0.225], dtype=np.float32)

logger = logging.getLogger("smarthive")
_trava = threading.Lock()
_sessoes: dict[str, object] = {}


@dataclass(frozen=True)
class Contagem:
    abelhas: int
    confianca: float


@dataclass(frozen=True)
class Invasor:
    nome: str
    confianca: float
    regiao: tuple[int, int, int, int]


def limpar_cache() -> None:
    with _trava:
        _sessoes.clear()


def _carregar(configuracao: str = "modelo_abelhas"):
    if configuracao not in _sessoes:
        caminho = getattr(get_settings(), configuracao)
        sessao = None
        if caminho.is_file():
            import onnxruntime as ort

            opcoes = ort.SessionOptions()
            opcoes.intra_op_num_threads = 1
            sessao = ort.InferenceSession(str(caminho), sess_options=opcoes, providers=["CPUExecutionProvider"])
        else:
            logger.warning("Modelo nao encontrado em %s", caminho)
        _sessoes[configuracao] = sessao
    return _sessoes[configuracao]


def _abrir(conteudo: bytes) -> Image.Image | None:
    with Image.open(io.BytesIO(conteudo)) as original:
        if original.width * original.height > MAXIMO_DE_PIXELS:
            return None
        original.draft("RGB", (TAMANHO, TAMANHO))
        return original.convert("RGB")


def _tensor(imagem: Image.Image) -> np.ndarray:
    largura, altura = imagem.size
    escala = TAMANHO / max(largura, altura)
    nova_largura, nova_altura = round(largura * escala), round(altura * escala)
    tela = Image.new("RGB", (TAMANHO, TAMANHO), (114, 114, 114))
    tela.paste(imagem.resize((nova_largura, nova_altura), Image.BILINEAR), ((TAMANHO - nova_largura) // 2, (TAMANHO - nova_altura) // 2))
    return (np.asarray(tela, dtype=np.float32) / 255).transpose(2, 0, 1)[np.newaxis]


def _caixas(saida: np.ndarray) -> list[tuple[float, float, float, float, float]]:
    confiancas = saida[4:].max(axis=0)
    indices = np.where(confiancas >= CONFIANCA_MINIMA)[0]
    candidatas = sorted(
        (
            (
                float(confiancas[i]),
                float(saida[0, i] - saida[2, i] / 2),
                float(saida[1, i] - saida[3, i] / 2),
                float(saida[0, i] + saida[2, i] / 2),
                float(saida[1, i] + saida[3, i] / 2),
            )
            for i in indices
        ),
        reverse=True,
    )
    finais: list[tuple[float, float, float, float, float]] = []
    for candidata in candidatas:
        if all(_iou(escolhida, candidata) <= IOU_MAXIMO for escolhida in finais):
            finais.append(candidata)
    return finais


def _iou(a, b) -> float:
    largura = max(0.0, min(a[3], b[3]) - max(a[1], b[1]))
    altura = max(0.0, min(a[4], b[4]) - max(a[2], b[2]))
    intersecao = largura * altura
    uniao = (a[3] - a[1]) * (a[4] - a[2]) + (b[3] - b[1]) * (b[4] - b[2]) - intersecao
    return intersecao / uniao if uniao > 0 else 0.0


def contar(conteudo: bytes, ignorar: tuple[int, int, int, int] | None = None) -> Contagem | None:
    try:
        with _trava:
            sessao = _carregar()
            if sessao is None:
                return None
            imagem = _abrir(conteudo)
            if imagem is None:
                return None
            saida = sessao.run(None, {sessao.get_inputs()[0].name: _tensor(imagem)})[0][0]
    except Exception:
        logger.exception("Falha ao contar abelhas na imagem")
        return None
    caixas = _caixas(saida)
    if ignorar is not None:
        escala = TAMANHO / max(imagem.size)
        margem_x = (TAMANHO - round(imagem.width * escala)) / 2
        margem_y = (TAMANHO - round(imagem.height * escala)) / 2
        x1, y1, x2, y2 = ignorar

        def fora(caixa) -> bool:
            cx = ((caixa[1] + caixa[3]) / 2 - margem_x) / escala
            cy = ((caixa[2] + caixa[4]) / 2 - margem_y) / escala
            return not (x1 <= cx <= x2 and y1 <= cy <= y2)

        caixas = [caixa for caixa in caixas if fora(caixa)]
    return Contagem(abelhas=len(caixas), confianca=caixas[0][0] if caixas else 0.0)


def _recortes(imagem: Image.Image, divisoes: int):
    largura, altura = imagem.size
    lado = max(largura, altura) / divisoes * 1.2
    for i in range(divisoes):
        for j in range(divisoes):
            cx, cy = largura * (i + 0.5) / divisoes, altura * (j + 0.5) / divisoes
            caixa = (
                round(max(0, cx - lado / 2)),
                round(max(0, cy - lado / 2)),
                round(min(largura, cx + lado / 2)),
                round(min(altura, cy + lado / 2)),
            )
            yield caixa, imagem.crop(caixa)


def _probabilidade_de_aranha(sessao, recorte: Image.Image) -> float:
    entrada = recorte.resize((TAMANHO_CLASSIFICADOR, TAMANHO_CLASSIFICADOR), Image.BILINEAR)
    tensor = ((np.asarray(entrada, dtype=np.float32) / 255 - MEDIA) / DESVIO).transpose(2, 0, 1)[np.newaxis]
    logits = sessao.run(None, {sessao.get_inputs()[0].name: tensor.astype(np.float32)})[0][0]
    probabilidades = np.exp(logits - logits.max())
    probabilidades /= probabilidades.sum()
    return float(probabilidades[list(CLASSES_DE_ARANHA)].sum())


def detectar_invasor(conteudo: bytes) -> Invasor | None:
    try:
        with _trava:
            sessao = _carregar("modelo_classificador")
            if sessao is None:
                return None
            imagem = _abrir(conteudo)
            if imagem is None:
                return None
            maior = 0.0
            positivas = []
            for divisoes in (3, 2):
                for caixa, recorte in _recortes(imagem, divisoes):
                    probabilidade = _probabilidade_de_aranha(sessao, recorte)
                    maior = max(maior, probabilidade)
                    if probabilidade >= CONFIANCA_REGIAO_ARANHA:
                        positivas.append(caixa)
    except Exception:
        logger.exception("Falha ao procurar invasores na imagem")
        return None
    if maior < CONFIANCA_ARANHA:
        return None
    regiao = (
        min(c[0] for c in positivas),
        min(c[1] for c in positivas),
        max(c[2] for c in positivas),
        max(c[3] for c in positivas),
    )
    return Invasor(nome="aranha", confianca=maior, regiao=regiao)

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

logger = logging.getLogger("smarthive")
_trava = threading.Lock()
_sessao = None
_carregado = False


@dataclass(frozen=True)
class Contagem:
    abelhas: int
    confianca: float


def limpar_cache() -> None:
    global _sessao, _carregado
    with _trava:
        _sessao = None
        _carregado = False


def _carregar():
    global _sessao, _carregado
    if not _carregado:
        _carregado = True
        caminho = get_settings().modelo_abelhas
        if caminho.is_file():
            import onnxruntime as ort

            opcoes = ort.SessionOptions()
            opcoes.intra_op_num_threads = 1
            _sessao = ort.InferenceSession(str(caminho), sess_options=opcoes, providers=["CPUExecutionProvider"])
        else:
            logger.warning("Modelo de contagem nao encontrado em %s", caminho)
    return _sessao


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


def contar(conteudo: bytes) -> Contagem | None:
    try:
        with _trava:
            sessao = _carregar()
            if sessao is None:
                return None
            with Image.open(io.BytesIO(conteudo)) as original:
                if original.width * original.height > MAXIMO_DE_PIXELS:
                    return None
                original.draft("RGB", (TAMANHO, TAMANHO))
                imagem = original.convert("RGB")
            saida = sessao.run(None, {sessao.get_inputs()[0].name: _tensor(imagem)})[0][0]
    except Exception:
        logger.exception("Falha ao contar abelhas na imagem")
        return None
    caixas = _caixas(saida)
    return Contagem(abelhas=len(caixas), confianca=caixas[0][0] if caixas else 0.0)

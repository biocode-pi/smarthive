// O caminho relativo e necessario: o pacote nao exporta estes arquivos pelo nome.
import mjsUrl from "../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs?url";
import wasmUrl from "../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm?url";

/**
 * Detector de abelhas treinado pelo grupo (YOLOv8 exportado para ONNX), rodando no proprio
 * aparelho: as imagens nao vao para um servidor para serem analisadas.
 *
 * O nome do arquivo leva a versao porque o deploy publica tudo com cache de 1 ano.
 * Como gerar o arquivo: docs/modelo-visao.md.
 */
const MODELO_URL = "/modelos/jatai-v1.onnx";
const TAMANHO = 640;
const CONFIANCA_MINIMA = 0.25;
const IOU_MAXIMO = 0.45;

export interface Deteccao {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  confianca: number;
}

export interface DetectorAbelhas {
  detectar(fonte: HTMLVideoElement | HTMLImageElement): Promise<Deteccao[]>;
}

type Fonte = HTMLVideoElement | HTMLImageElement;

function dimensoes(fonte: Fonte) {
  return fonte instanceof HTMLVideoElement
    ? { largura: fonte.videoWidth, altura: fonte.videoHeight }
    : { largura: fonte.naturalWidth, altura: fonte.naturalHeight };
}

/** Imagem em 640x640 mantendo a proporcao, com faixas cinza, como no treinamento. */
function tensorDaImagem(fonte: Fonte, contexto: CanvasRenderingContext2D): Float32Array {
  const { largura, altura } = dimensoes(fonte);
  const escala = TAMANHO / Math.max(largura, altura);
  const w = Math.round(largura * escala);
  const h = Math.round(altura * escala);
  contexto.fillStyle = "rgb(114,114,114)";
  contexto.fillRect(0, 0, TAMANHO, TAMANHO);
  contexto.drawImage(fonte, Math.floor((TAMANHO - w) / 2), Math.floor((TAMANHO - h) / 2), w, h);

  const { data } = contexto.getImageData(0, 0, TAMANHO, TAMANHO);
  const total = TAMANHO * TAMANHO;
  const tensor = new Float32Array(total * 3);
  for (let i = 0; i < total; i += 1) {
    tensor[i] = data[i * 4] / 255;
    tensor[total + i] = data[i * 4 + 1] / 255;
    tensor[2 * total + i] = data[i * 4 + 2] / 255;
  }
  return tensor;
}

function iou(a: Deteccao, b: Deteccao) {
  const largura = Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1));
  const altura = Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));
  const intersecao = largura * altura;
  const uniao = (a.x2 - a.x1) * (a.y2 - a.y1) + (b.x2 - b.x1) * (b.y2 - b.y1) - intersecao;
  return uniao > 0 ? intersecao / uniao : 0;
}

/** Saida do YOLOv8 exportado sem NMS: [1, 4 + classes, n], com centro, largura, altura e notas. */
function interpretarSaida(dados: Float32Array, colunas: number, linhas: number): Deteccao[] {
  const candidatas: Deteccao[] = [];
  for (let i = 0; i < linhas; i += 1) {
    let confianca = 0;
    for (let classe = 4; classe < colunas; classe += 1) {
      confianca = Math.max(confianca, dados[classe * linhas + i]);
    }
    if (confianca < CONFIANCA_MINIMA) continue;
    const cx = dados[i];
    const cy = dados[linhas + i];
    const w = dados[2 * linhas + i];
    const h = dados[3 * linhas + i];
    candidatas.push({ x1: cx - w / 2, y1: cy - h / 2, x2: cx + w / 2, y2: cy + h / 2, confianca });
  }

  const finais: Deteccao[] = [];
  for (const candidata of candidatas.sort((a, b) => b.confianca - a.confianca)) {
    if (finais.every((escolhida) => iou(escolhida, candidata) <= IOU_MAXIMO)) finais.push(candidata);
  }
  return finais;
}

/** Baixa o modelo, se ele existir. Devolve null quando nao houver um modelo utilizavel. */
export async function carregarDetector(): Promise<DetectorAbelhas | null> {
  try {
    const resposta = await fetch(MODELO_URL);
    if (!resposta.ok || (resposta.headers.get("content-type") ?? "").includes("text/html")) return null;
    const modelo = await resposta.arrayBuffer();

    const ort = await import("onnxruntime-web/wasm");
    ort.env.wasm.wasmPaths = { mjs: mjsUrl, wasm: wasmUrl };
    ort.env.wasm.numThreads = 1; // varias threads exigiriam cabecalhos COOP/COEP no site
    const sessao = await ort.InferenceSession.create(modelo, { executionProviders: ["wasm"] });

    const canvas = document.createElement("canvas");
    canvas.width = TAMANHO;
    canvas.height = TAMANHO;
    const contexto = canvas.getContext("2d", { willReadFrequently: true });
    if (!contexto) return null;

    const rodar = async (imagem: Float32Array) => {
      const entrada = new ort.Tensor("float32", imagem, [1, 3, TAMANHO, TAMANHO]);
      const saida = await sessao.run({ [sessao.inputNames[0]]: entrada });
      return saida[sessao.outputNames[0]];
    };

    // Confere o formato uma vez: um modelo exportado de outro jeito nao pode virar contagem errada.
    const teste = await rodar(new Float32Array(3 * TAMANHO * TAMANHO));
    if (teste.dims.length !== 3 || teste.dims[0] !== 1 || teste.dims[1] < 5) return null;

    // A sessao nao aceita duas analises ao mesmo tempo (camera e foto enviada).
    let fila: Promise<unknown> = Promise.resolve();
    return {
      detectar(fonte) {
        const analise = fila.then(async () => {
          const resultado = await rodar(tensorDaImagem(fonte, contexto));
          return interpretarSaida(resultado.data as Float32Array, resultado.dims[1], resultado.dims[2]);
        });
        fila = analise.catch(() => undefined);
        return analise;
      },
    };
  } catch (erro) {
    console.warn("Detector de abelhas indisponível", erro);
    return null;
  }
}

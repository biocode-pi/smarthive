import type { MobileNet } from "@tensorflow-models/mobilenet";
import { Loader2, Video } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { botao, Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Leituras } from "../components/ui/Leituras";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHeader } from "../components/ui/PageHeader";
import { listarColmeias } from "../services/colmeias";
import { carregarDetector, type DetectorAbelhas } from "../services/detectorAbelhas";
import { registrarCapturaSensorCelular } from "../services/sensorCelular";
import type { Colmeia } from "../types";
import { cn } from "../utils/classNames";

type Prediction = {
  className: string;
  probability: number;
};

type TargetKind = "bee" | "invader";

type TargetPrediction = {
  kind: TargetKind;
  label: string;
  prediction: Prediction;
};

const TARGET_CONFIDENCE = 0.2;
const beeTerms = ["bee", "honeybee", "honey bee", "bumblebee"];
const invaderTerms = [
  "wasp",
  "hornet",
  "yellow jacket",
  "ant",
  "spider",
  "mantis",
  "lizard",
  "fly",
  "dragonfly",
  "beetle",
  "cockroach",
  "centipede",
  "scorpion",
  "moth",
];

const emptyForm = {
  colmeia_id: "",
  duracao_segundos: "60",
  observacoes: "",
  possivel_invasor: false,
};

function isBeePrediction(prediction: Prediction) {
  const label = prediction.className.toLowerCase();
  return beeTerms.some((term) => label.includes(term));
}

function isInvaderPrediction(prediction: Prediction) {
  const label = prediction.className.toLowerCase();
  return invaderTerms.some((term) => label.includes(term));
}

function pickTargetPrediction(predictions: Prediction[]): TargetPrediction | null {
  const candidates = predictions
    .map((prediction): TargetPrediction | null => {
      if (prediction.probability < TARGET_CONFIDENCE) return null;
      if (isBeePrediction(prediction)) return { kind: "bee", label: "Abelha", prediction };
      if (isInvaderPrediction(prediction)) return { kind: "invader", label: "Possível invasor", prediction };
      return null;
    })
    .filter((item): item is TargetPrediction => item !== null)
    .sort((a, b) => b.prediction.probability - a.prediction.probability);

  return candidates[0] ?? null;
}

const CHAVE_CAMERA = "smarthive-camera";

function cameraSalva() {
  try {
    return localStorage.getItem(CHAVE_CAMERA) ?? "";
  } catch {
    return "";
  }
}

function salvarCamera(id: string) {
  try {
    if (id) localStorage.setItem(CHAVE_CAMERA, id);
    else localStorage.removeItem(CHAVE_CAMERA);
  } catch {
    // Sem armazenamento, a escolha vale so ate fechar a pagina.
  }
}

/** Nome da camera sem o codigo USB que o navegador acrescenta: "GoPro Webcam (2672:0056)". */
function nomeDaCamera(camera: MediaDeviceInfo, indice: number) {
  return camera.label.replace(/\s*\([0-9a-f]{4}:[0-9a-f]{4}\)$/i, "") || `Câmera ${indice + 1}`;
}

function confidenceLabel(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function SensorCelular() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<MobileNet | null>(null);
  // Modelo treinado pelo grupo; sem ele, a pagina usa o reconhecimento generico.
  const detectorRef = useRef<DetectorAbelhas | null>(null);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Cada ciclo de analise tem um numero; ao parar ou trocar de camera, o ciclo antigo se encerra.
  const cicloRef = useRef(0);

  const [colmeias, setColmeias] = useState<Colmeia[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [modelLoading, setModelLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [abelhasNaImagem, setAbelhasNaImagem] = useState(0);
  const [abrindoCamera, setAbrindoCamera] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [cameraId, setCameraId] = useState(cameraSalva);
  const [saving, setSaving] = useState(false);
  const [targetPrediction, setTargetPrediction] = useState<TargetPrediction | null>(null);
  const [lastTargetPrediction, setLastTargetPrediction] = useState<TargetPrediction | null>(null);
  const [beeDetected, setBeeDetected] = useState(false);
  const [invaderDetected, setInvaderDetected] = useState(false);
  const [detections, setDetections] = useState(0);
  const [invaderDetections, setInvaderDetections] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    listarColmeias()
      .then((items) => {
        setColmeias(items);
        // Vindo de uma colmeia ("Nova captura"), ela ja vem escolhida.
        const pedida = items.find((item) => item.id === searchParams.get("colmeia")) ?? items[0];
        if (pedida) setForm((state) => ({ ...state, colmeia_id: pedida.id }));
      })
      .finally(() => setLoading(false));

    return () => stopCamera();
  }, []);

  // A lista acompanha o que for plugado ou desplugado com a pagina aberta (ex.: a GoPro).
  useEffect(() => {
    const dispositivos = navigator.mediaDevices;
    if (!dispositivos?.enumerateDevices) return;
    void atualizarCameras();
    dispositivos.addEventListener?.("devicechange", atualizarCameras);
    return () => dispositivos.removeEventListener?.("devicechange", atualizarCameras);
  }, []);

  async function atualizarCameras() {
    try {
      const lista = await navigator.mediaDevices.enumerateDevices();
      // Antes da permissao o navegador pode devolver entradas sem id, que nao servem para escolher.
      setCameras(lista.filter((item) => item.kind === "videoinput" && item.deviceId));
    } catch {
      setCameras([]);
    }
  }

  function setField(key: keyof typeof form, value: string | boolean) {
    setForm((state) => ({ ...state, [key]: value }));
  }

  async function ensureModel() {
    if (detectorRef.current || modelRef.current) return;
    setModelLoading(true);
    try {
      detectorRef.current = await carregarDetector();
      if (detectorRef.current) return;
      const [tf, mobilenet] = await Promise.all([import("@tensorflow/tfjs"), import("@tensorflow-models/mobilenet")]);
      await tf.ready();
      modelRef.current = await mobilenet.load({ version: 2, alpha: 1 });
    } finally {
      setModelLoading(false);
    }
  }

  async function analisar(fonte: HTMLVideoElement | HTMLImageElement, quantidade: number): Promise<Prediction[]> {
    if (detectorRef.current) {
      const deteccoes = await detectorRef.current.detectar(fonte);
      setAbelhasNaImagem(deteccoes.length);
      const melhor = Math.max(0, ...deteccoes.map((item) => item.confianca));
      return deteccoes.length ? [{ className: "bee", probability: melhor }] : [];
    }
    return (await modelRef.current!.classify(fonte, quantidade)) as Prediction[];
  }

  async function startCamera(idEscolhido = cameraId) {
    setCameraError(null);
    setMessage(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Este navegador não dá acesso à câmera. Use o Chrome ou o Safari do celular, ou envie uma foto abaixo.");
      return;
    }

    setAbrindoCamera(true);
    try {
      await ensureModel();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          // Sem escolha, usa a camera traseira no celular; com escolha, exatamente aquela.
          ...(idEscolhido ? { deviceId: { exact: idEscolhido } } : { facingMode: { ideal: "environment" } }),
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
      runAnalysisLoop();
      // So depois da permissao o navegador informa os nomes das cameras.
      setCameraId(stream.getVideoTracks()[0]?.getSettings().deviceId ?? idEscolhido);
      await atualizarCameras();
    } catch (error) {
      const nome = error instanceof DOMException ? error.name : "";
      if (nome === "OverconstrainedError" || nome === "NotFoundError") {
        // A camera guardada foi desconectada: volta para a padrao e mostra o que existe agora.
        setCameraId("");
        salvarCamera("");
        await atualizarCameras();
        setCameraError("Essa câmera não está conectada. Confira o cabo ou toque em Abrir câmera para usar a padrão.");
      } else {
        setCameraError(
          nome === "NotAllowedError"
            ? "A câmera foi bloqueada. Libere o acesso nas permissões do navegador e toque em Abrir câmera de novo."
            : "Não foi possível abrir a câmera. Feche outros apps que estejam usando e tente de novo.",
        );
      }
    } finally {
      setAbrindoCamera(false);
    }
  }

  function escolherCamera(id: string) {
    setCameraId(id);
    salvarCamera(id);
    if (cameraActive) {
      stopCamera();
      void startCamera(id);
    }
  }

  function stopCamera() {
    cicloRef.current += 1;
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  }

  function applyPredictions(result: Prediction[]) {
    const target = pickTargetPrediction(result);
    setTargetPrediction(target);
    if (target) setLastTargetPrediction(target);

    if (target?.kind === "bee") {
      setBeeDetected(true);
      setDetections((value) => value + 1);
    }

    if (target?.kind === "invader") {
      setInvaderDetected(true);
      setInvaderDetections((value) => value + 1);
      setField("possivel_invasor", true);
    }
  }

  async function classifyImageFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setMessage("Vídeo anexado. A contagem automática só funciona com foto ou com a câmera aberta.");
      return;
    }

    setCameraError(null);
    setMessage(null);

    try {
      await ensureModel();
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Imagem inválida"));
        img.src = URL.createObjectURL(file);
      });
      applyPredictions(await analisar(image, 8));
      URL.revokeObjectURL(image.src);
    } catch {
      setCameraError("Não foi possível ler esta imagem. Tente outra foto, em JPG ou PNG.");
    }
  }

  function runAnalysisLoop() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    cicloRef.current += 1;
    const ciclo = cicloRef.current;

    const analyze = async () => {
      if (ciclo !== cicloRef.current) return;
      const pronto = detectorRef.current ?? modelRef.current;
      const video = videoRef.current;

      if (!pronto || !video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        timerRef.current = window.setTimeout(analyze, 900);
        return;
      }

      try {
        const result = await analisar(video, 5);
        if (ciclo === cicloRef.current) applyPredictions(result);
      } catch {
        if (ciclo === cicloRef.current) setCameraError("A contagem parou. Toque em Parar câmera e abra de novo.");
      } finally {
        if (ciclo === cicloRef.current) timerRef.current = window.setTimeout(analyze, 1200);
      }
    };

    analyze();
  }

  async function frameToFile() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return null;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise<File | null>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          resolve(new File([blob], `smarthive-camera-${Date.now()}.jpg`, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.9,
      );
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const capturedFrame = await frameToFile();
    const currentTarget = targetPrediction ?? lastTargetPrediction;

    const formData = new FormData();
    formData.append("colmeia_id", form.colmeia_id);
    formData.append("duracao_segundos", form.duracao_segundos);
    formData.append("movimentos_estimados", String(Math.max(detections, beeDetected ? 1 : 0)));
    formData.append("abelhas_entrando", String(beeDetected ? Math.max(1, detections) : 0));
    formData.append("abelhas_saindo", "0");
    formData.append("possivel_invasor", String(form.possivel_invasor || invaderDetected));
    formData.append(
      "observacoes",
      [
        form.observacoes,
        currentTarget
          ? `Leitura automática: ${currentTarget.label.toLowerCase()} na imagem (${confidenceLabel(currentTarget.prediction.probability)}).`
          : "Leitura automática: nenhuma abelha ou invasor na imagem.",
      ]
        .filter(Boolean)
        .join("\n"),
    );

    const file = capturedFrame ?? arquivo;
    if (file) formData.append("arquivo", file);

    try {
      const response = await registrarCapturaSensorCelular(formData);
      setMessage(response.mensagem);
      navigate(`/app/colmeias/${form.colmeia_id}`);
    } catch {
      setMessage("Não foi possível salvar a captura. Confira a conexão e tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;

  const leituraAtual = targetPrediction
    ? `${abelhasNaImagem > 1 ? `${abelhasNaImagem} abelhas` : targetPrediction.label} na imagem · ${confidenceLabel(targetPrediction.prediction.probability)}`
    : cameraActive
      ? "Procurando movimento na entrada…"
      : "Foto sem abelha ou invasor";
  const tomLeitura =
    targetPrediction?.kind === "bee"
      ? "bg-honey-500 text-ink"
      : targetPrediction?.kind === "invader"
        ? "bg-status-risco-texto text-white"
        : "bg-ink/70 text-white";

  return (
    <>
      <PageHeader
        title="Captura"
        leitura="Aponte a câmera para a entrada da caixa. A contagem acontece no próprio aparelho."
      />

      {colmeias.length === 0 ? (
        <EmptyState
          title="Nenhuma colmeia para capturar"
          description="Toda captura pertence a uma colmeia. Cadastre a primeira e volte aqui."
          acao={
            <Link to="/app/colmeias?nova=1" className={botao("primary")}>
              Cadastrar colmeia
            </Link>
          }
        />
      ) : (
        <section className="grid gap-10 xl:grid-cols-[1.35fr_0.9fr] xl:gap-12">
          <div className="min-w-0">
            <div className="relative overflow-hidden rounded-[24px] bg-ink">
              <video ref={videoRef} className="aspect-[4/3] w-full object-cover sm:aspect-video" playsInline muted autoPlay />
              {!cameraActive ? (
                <div className="absolute inset-0 flex flex-col items-start justify-end bg-ink p-6 sm:p-8">
                  <p className="font-expo text-2xl font-extrabold text-honey-500 [font-stretch:112%] sm:text-3xl">
                    {modelLoading ? "Preparando a câmera…" : "Câmera desligada"}
                  </p>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/70">
                    Posicione a câmera a um palmo da entrada, sem tampar o tubo, e deixe as abelhas passarem.
                  </p>
                </div>
              ) : null}
              <p className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-ink/70 px-3 py-1 font-dados text-[11px] uppercase tracking-[0.14em] text-white">
                <span className={cn("h-2 w-2 rounded-full", cameraActive ? "animate-pulse bg-status-risco" : "bg-white/40")} aria-hidden="true" />
                {cameraActive ? "Ao vivo" : "Parada"}
              </p>
              {cameraActive || targetPrediction ? (
                <p
                  role="status"
                  className={cn("absolute bottom-4 left-4 right-4 rounded-full px-4 py-2.5 font-dados text-sm transition-colors", tomLeitura)}
                >
                  {leituraAtual}
                </p>
              ) : null}
            </div>

            {cameraError ? (
              <p role="alert" className="mt-4 text-sm font-bold text-status-risco-texto">
                {cameraError}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                onClick={cameraActive ? stopCamera : () => void startCamera()}
                disabled={modelLoading || abrindoCamera}
                icon={modelLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Video className="h-4 w-4" aria-hidden="true" />}
              >
                {cameraActive ? "Parar câmera" : modelLoading ? "Preparando…" : "Abrir câmera"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setBeeDetected(false);
                  setInvaderDetected(false);
                  setDetections(0);
                  setAbelhasNaImagem(0);
                  setInvaderDetections(0);
                  setTargetPrediction(null);
                  setLastTargetPrediction(null);
                  setField("possivel_invasor", false);
                }}
              >
                Zerar contagem
              </Button>
            </div>

            {cameras.length > 1 ? (
              <label className="campo-rotulo mt-5 max-w-md">
                Câmera
                <select
                  className="campo"
                  value={cameras.some((camera) => camera.deviceId === cameraId) ? cameraId : ""}
                  onChange={(event) => escolherCamera(event.target.value)}
                  disabled={modelLoading || abrindoCamera}
                >
                  <option value="">Câmera padrão</option>
                  {cameras.map((camera, indice) => (
                    <option key={camera.deviceId} value={camera.deviceId}>
                      {nomeDaCamera(camera, indice)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <Leituras
              className="mt-8"
              itens={[
                { rotulo: "Quadros com abelha", valor: detections, nota: beeDetected ? "abelhas vistas" : "nenhuma ainda" },
                {
                  rotulo: "Quadros com invasor",
                  valor: invaderDetections,
                  nota: invaderDetected ? "confira a entrada" : "nenhum visto",
                  alerta: invaderDetected,
                },
              ]}
            />

            <canvas ref={canvasRef} className="hidden" />
          </div>

          <form onSubmit={handleSubmit} className="surface h-fit p-5 sm:p-7">
            <h2 className="titulo-secao">Salvar captura</h2>
            {message ? (
              <p role="status" className="mt-3 text-sm font-bold text-ink">
                {message}
              </p>
            ) : null}

            <div className="mt-5 space-y-4">
              <label className="campo-rotulo">
                Colmeia
                <select className="campo" value={form.colmeia_id} onChange={(event) => setField("colmeia_id", event.target.value)} required>
                  {colmeias.map((colmeia) => (
                    <option key={colmeia.id} value={colmeia.id}>
                      {colmeia.codigo ? `${colmeia.codigo} · ` : ""}
                      {colmeia.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label className="campo-rotulo">
                Tempo observando (segundos)
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  className="campo font-dados"
                  value={form.duracao_segundos}
                  onChange={(event) => setField("duracao_segundos", event.target.value)}
                  required
                />
              </label>

              <label className="campo-rotulo">
                Foto ou vídeo do celular (opcional)
                <input
                  type="file"
                  accept="image/*,video/*"
                  capture="environment"
                  className="focus-ring w-full rounded-field border-2 border-dashed border-ink/20 bg-honey-50 px-3 py-3 text-sm font-normal file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-bold file:text-honey-500"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setArquivo(file);
                    if (file) void classifyImageFile(file);
                  }}
                />
                <span className="text-xs font-normal text-ink/60">Sem câmera aberta, uma foto da entrada também conta.</span>
              </label>

              <label className="flex items-center gap-3 border-y border-ink/10 py-3">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-ink/30 accent-ink"
                  checked={form.possivel_invasor}
                  onChange={(event) => setField("possivel_invasor", event.target.checked)}
                />
                <span className="text-sm font-bold text-ink">Vi um possível invasor</span>
              </label>

              <label className="campo-rotulo">
                Anotações
                <textarea
                  className="campo"
                  value={form.observacoes}
                  onChange={(event) => setField("observacoes", event.target.value)}
                  placeholder="Ex.: muitas campeiras com pólen, tempo nublado"
                />
              </label>
            </div>

            <Button type="submit" disabled={saving || !form.colmeia_id} className="mt-6 min-h-12 w-full">
              {saving ? "Salvando…" : "Salvar captura"}
            </Button>
          </form>
        </section>
      )}
    </>
  );
}

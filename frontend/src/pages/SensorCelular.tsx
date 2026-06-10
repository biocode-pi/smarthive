import type { MobileNet } from "@tensorflow-models/mobilenet";
import { Camera, CheckCircle2, Loader2, Save, ScanSearch, Video, XCircle } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHeader } from "../components/ui/PageHeader";
import { listarColmeias } from "../services/colmeias";
import { registrarCapturaSensorCelular } from "../services/sensorCelular";
import type { Colmeia } from "../types";

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
      if (isInvaderPrediction(prediction)) return { kind: "invader", label: "Possivel invasor", prediction };
      return null;
    })
    .filter((item): item is TargetPrediction => item !== null)
    .sort((a, b) => b.prediction.probability - a.prediction.probability);

  return candidates[0] ?? null;
}

function confidenceLabel(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function SensorCelular() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<MobileNet | null>(null);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [colmeias, setColmeias] = useState<Colmeia[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [modelLoading, setModelLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
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
        if (items[0]) setForm((state) => ({ ...state, colmeia_id: items[0].id }));
      })
      .finally(() => setLoading(false));

    return () => stopCamera();
  }, []);

  function setField(key: keyof typeof form, value: string | boolean) {
    setForm((state) => ({ ...state, [key]: value }));
  }

  async function ensureModel() {
    if (modelRef.current) return modelRef.current;
    setModelLoading(true);
    try {
      const [tf, mobilenet] = await Promise.all([import("@tensorflow/tfjs"), import("@tensorflow-models/mobilenet")]);
      await tf.ready();
      modelRef.current = await mobilenet.load({ version: 2, alpha: 1 });
      return modelRef.current;
    } finally {
      setModelLoading(false);
    }
  }

  async function startCamera() {
    setCameraError(null);
    setMessage(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera indisponivel neste navegador.");
      return;
    }

    try {
      await ensureModel();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
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
    } catch (error) {
      const permissionDenied = error instanceof DOMException && error.name === "NotAllowedError";
      setCameraError(
        permissionDenied
          ? "Permissao da camera negada."
          : "Nao foi possivel abrir a camera. Em celular, use HTTPS ou localhost.",
      );
    }
  }

  function stopCamera() {
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
    setPredictions(target ? [target.prediction] : []);
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
      setMessage("Para testar a IA por arquivo, selecione uma imagem.");
      return;
    }

    setCameraError(null);
    setMessage(null);

    try {
      const model = await ensureModel();
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Imagem invalida."));
        img.src = URL.createObjectURL(file);
      });
      const result = (await model.classify(image, 8)) as Prediction[];
      applyPredictions(result);
      URL.revokeObjectURL(image.src);
    } catch {
      setCameraError("Nao foi possivel analisar esta imagem.");
    }
  }

  function runAnalysisLoop() {
    if (timerRef.current) window.clearTimeout(timerRef.current);

    const analyze = async () => {
      const model = modelRef.current;
      const video = videoRef.current;

      if (!model || !video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        timerRef.current = window.setTimeout(analyze, 900);
        return;
      }

      try {
        const result = (await model.classify(video, 5)) as Prediction[];
        applyPredictions(result);
      } catch {
        setCameraError("Falha ao classificar o frame da camera.");
      } finally {
        timerRef.current = window.setTimeout(analyze, 1200);
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
          ? `IA: ${currentTarget.label.toLowerCase()} identificado como "${currentTarget.prediction.className}" com ${confidenceLabel(currentTarget.prediction.probability)} de confianca.`
          : "IA: nenhum alvo relevante identificado. Classes fora de abelha/invasor foram ignoradas.",
      ]
        .filter(Boolean)
        .join("\n"),
    );

    const file = capturedFrame ?? arquivo;
    if (file) formData.append("arquivo", file);

    try {
      const response = await registrarCapturaSensorCelular(formData);
      setMessage(response.mensagem);
      navigate(`/colmeias/${form.colmeia_id}`);
    } catch {
      setMessage("Nao foi possivel salvar a captura experimental.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;

  const statusText = targetPrediction
    ? `${targetPrediction.label}: ${targetPrediction.prediction.className}`
    : "Nenhuma abelha ou invasor identificado";
  const overlayClass =
    targetPrediction?.kind === "bee"
      ? "bg-hive-600/90 text-white"
      : targetPrediction?.kind === "invader"
        ? "bg-rose-600/90 text-white"
        : "bg-black/55 text-white";

  return (
    <>
      <PageHeader
        title="Camera IA"
        description="Captura visual pelo celular com classificacao local de abelhas."
      />

      {colmeias.length === 0 ? (
        <EmptyState
          icon={<Camera className="h-6 w-6" />}
          title="Nenhuma colmeia cadastrada"
          description="Cadastre uma colmeia antes de registrar capturas."
        />
      ) : (
        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
          <div className="surface rounded-xl p-4 sm:p-6">
            <div className="relative overflow-hidden rounded-xl bg-slate-950">
              <video
                ref={videoRef}
                className="aspect-[4/3] w-full object-cover sm:aspect-video"
                playsInline
                muted
                autoPlay
              />
              {!cameraActive ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/92 p-6 text-center">
                  <div>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-hive-600 text-white">
                      {modelLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Camera className="h-8 w-8" />}
                    </div>
                    <p className="text-lg font-bold text-white">Camera pronta</p>
                    <p className="mt-2 text-sm text-slate-300">MobileNet sera carregado antes da captura.</p>
                  </div>
                </div>
              ) : null}
              <div className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                {cameraActive ? "Ao vivo" : "Parado"}
              </div>
              <div
                className={`absolute bottom-3 left-3 right-3 rounded-xl px-4 py-3 backdrop-blur ${overlayClass}`}
              >
                <div className="flex items-center gap-2">
                  {targetPrediction ? <CheckCircle2 className="h-5 w-5" /> : <ScanSearch className="h-5 w-5" />}
                  <span className="font-bold">
                    {statusText}
                  </span>
                </div>
              </div>
            </div>

            {cameraError ? (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{cameraError}</span>
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={cameraActive ? stopCamera : startCamera}
                disabled={modelLoading}
                icon={modelLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
              >
                {cameraActive ? "Parar camera" : modelLoading ? "Carregando IA..." : "Abrir camera"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setBeeDetected(false);
                  setInvaderDetected(false);
                  setDetections(0);
                  setInvaderDetections(0);
                  setPredictions([]);
                  setTargetPrediction(null);
                  setLastTargetPrediction(null);
                  setField("possivel_invasor", false);
                }}
              >
                Reiniciar leitura
              </Button>
            </div>

            <canvas ref={canvasRef} className="hidden" />
          </div>

          <form onSubmit={handleSubmit} className="surface rounded-xl p-6">
            {message ? (
              <p className="mb-4 rounded-lg bg-hive-50 px-4 py-3 text-sm font-semibold text-hive-700">{message}</p>
            ) : null}

            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">Classificacao</p>
              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-bold text-slate-700">Abelha detectada</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${beeDetected ? "bg-hive-50 text-hive-700" : "bg-slate-100 text-slate-500"}`}>
                    {beeDetected ? "Sim" : "Nao"}
                  </span>
                </div>
                <p className="mt-3 text-3xl font-black text-slate-950">{detections}</p>
                <p className="text-xs font-semibold text-slate-500">leituras positivas</p>
              </div>
              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-bold text-slate-700">Invasor detectado</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${invaderDetected ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-500"}`}>
                    {invaderDetected ? "Sim" : "Nao"}
                  </span>
                </div>
                <p className="mt-3 text-3xl font-black text-slate-950">{invaderDetections}</p>
                <p className="text-xs font-semibold text-slate-500">leituras positivas</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Colmeia
                <select
                  className="focus-ring rounded-lg border border-slate-200 bg-white px-3 py-2"
                  value={form.colmeia_id}
                  onChange={(event) => setField("colmeia_id", event.target.value)}
                  required
                >
                  {colmeias.map((colmeia) => (
                    <option key={colmeia.id} value={colmeia.id}>
                      {colmeia.nome} - {colmeia.especie}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Duracao da observacao
                <input
                  type="number"
                  min="1"
                  className="focus-ring rounded-lg border border-slate-200 bg-white px-3 py-2"
                  value={form.duracao_segundos}
                  onChange={(event) => setField("duracao_segundos", event.target.value)}
                  required
                />
              </label>

              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Captura nativa
                <input
                  type="file"
                  accept="image/*,video/*"
                  capture="environment"
                  className="focus-ring rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setArquivo(file);
                    if (file) void classifyImageFile(file);
                  }}
                />
                <span className="text-xs font-medium text-slate-500">
                  Use imagens de teste de abelhas, formigas, aranhas ou vespas para validar antes de salvar.
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-hive-600 focus:ring-hive-500"
                  checked={form.possivel_invasor}
                  onChange={(event) => setField("possivel_invasor", event.target.checked)}
                />
                <span className="text-sm font-semibold text-slate-700">Possivel invasor</span>
              </label>

              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Observacoes
                <textarea
                  className="focus-ring min-h-28 rounded-lg border border-slate-200 bg-white px-3 py-2"
                  value={form.observacoes}
                  onChange={(event) => setField("observacoes", event.target.value)}
                />
              </label>
            </div>

            <div className="mt-5 space-y-3">
              {predictions.length ? (
                predictions.map((prediction) => (
                  <div key={prediction.className} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                    <span className="truncate text-sm font-semibold text-slate-700">
                      {targetPrediction?.label ?? "Alvo"}: {prediction.className}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{confidenceLabel(prediction.probability)}</span>
                  </div>
                ))
              ) : (
                <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">
                  Classes irrelevantes sao ignoradas.
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <Button type="submit" disabled={saving || !form.colmeia_id} icon={<Save className="h-4 w-4" />}>
                {saving ? "Salvando..." : "Salvar captura"}
              </Button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}

import {
  Activity,
  Camera,
  Cloud,
  CloudOff,
  RefreshCw,
  Radio,
  RotateCcw,
  Square,
  Video,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHeader } from "../components/ui/PageHeader";
import {
  cacheCameraCapture,
  countCachedCameraCaptures,
  syncCachedCameraCaptures,
  type CameraCapturePayload,
} from "../services/cameraCache";
import { listarColmeias } from "../services/colmeias";
import { registrarCapturaSensorCelular } from "../services/sensorCelular";
import type { Colmeia } from "../types";

type BeeDetection = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
  moving: boolean;
  isBee: boolean;
};

type FrameAnalysis = {
  detections: BeeDetection[];
  sourceWidth: number;
  sourceHeight: number;
};

type DetectorState = {
  previousGray: Uint8ClampedArray | null;
  background: Float32Array | null;
  framesSeen: number;
};

type ChunkStats = {
  framesWithActivity: number;
  movementScore: number;
  beeEntries: number;
  possibleInvader: boolean;
};

const DETECTOR_WIDTH = 320;
const ANALYSIS_INTERVAL_MS = 320;
const RECORDING_CHUNK_MS = 15_000;
const FALLBACK_SNAPSHOT_MS = 15_000;
const MOTION_THRESHOLD = 26;
const DARK_THRESHOLD = 118;
const SATURATION_THRESHOLD = 12;
// Background subtraction: learn the static scene and only flag things that do not belong.
const BACKGROUND_ALPHA = 0.015;
const FOREGROUND_THRESHOLD = 34;
const WARMUP_FRAMES = 22;
const MAX_DETECTIONS = 6;
const RADAR_ZONE = { x: 0.22, y: 0.24, width: 0.56, height: 0.52 };
const RADAR_EVENT_COOLDOWN_MS = 1800;

const emptyStats: ChunkStats = {
  framesWithActivity: 0,
  movementScore: 0,
  beeEntries: 0,
  possibleInvader: false,
};

function cloneEmptyStats(): ChunkStats {
  return { ...emptyStats };
}

function pickRecordingMimeType() {
  if (!("MediaRecorder" in window)) return "";

  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];

  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function extensionForContentType(contentType: string) {
  if (contentType.includes("mp4")) return "mp4";
  if (contentType.includes("jpeg")) return "jpg";
  if (contentType.includes("png")) return "png";
  return "webm";
}

function createCaptureFormData(payload: CameraCapturePayload, blob: Blob, filename: string, contentType: string) {
  const formData = new FormData();
  formData.append("colmeia_id", payload.colmeia_id);
  formData.append("movimentos_estimados", String(payload.movimentos_estimados));
  formData.append("abelhas_entrando", String(payload.abelhas_entrando));
  formData.append("abelhas_saindo", String(payload.abelhas_saindo));
  formData.append("possivel_invasor", String(payload.possivel_invasor));
  formData.append("observacoes", payload.observacoes ?? "");
  formData.append("arquivo", new File([blob], filename, { type: contentType }));
  return formData;
}

function buildObservation(base: string, stats: ChunkStats, recordedAt: string, cached: boolean) {
  return [
    base,
    `Camera continua: ${stats.beeEntries} entrada(s) de abelha, ${stats.framesWithActivity} evento(s) no radar e ${stats.movementScore} movimento(s) estimado(s).`,
    cached ? `Cache offline criado em ${recordedAt}.` : `Captura sincronizada em ${recordedAt}.`,
  ]
    .filter(Boolean)
    .join("\n");
}

function analyzeFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  detectorState: DetectorState,
): FrameAnalysis | null {
  if (!video.videoWidth || !video.videoHeight) return null;

  const sourceWidth = DETECTOR_WIDTH;
  const sourceHeight = Math.max(1, Math.round((sourceWidth * video.videoHeight) / video.videoWidth));
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  context.drawImage(video, 0, 0, sourceWidth, sourceHeight);
  const pixels = context.getImageData(0, 0, sourceWidth, sourceHeight).data;
  const pixelCount = sourceWidth * sourceHeight;
  const gray = new Uint8ClampedArray(pixelCount);
  const motionMask = new Uint8Array(pixelCount);
  const beeToneMask = new Uint8Array(pixelCount);
  const foregroundMask = new Uint8Array(pixelCount);
  const previousGray = detectorState.previousGray;

  // Initialize background on first frame so the static scene is captured immediately.
  if (!detectorState.background || detectorState.background.length !== pixelCount) {
    detectorState.background = new Float32Array(pixelCount);
    detectorState.framesSeen = 0;
    for (let pixelIndex = 0, dataIndex = 0; pixelIndex < pixelCount; pixelIndex += 1, dataIndex += 4) {
      const red = pixels[dataIndex];
      const green = pixels[dataIndex + 1];
      const blue = pixels[dataIndex + 2];
      detectorState.background[pixelIndex] = Math.round(red * 0.299 + green * 0.587 + blue * 0.114);
    }
  }

  const background = detectorState.background;

  for (let pixelIndex = 0, dataIndex = 0; pixelIndex < pixelCount; pixelIndex += 1, dataIndex += 4) {
    const red = pixels[dataIndex];
    const green = pixels[dataIndex + 1];
    const blue = pixels[dataIndex + 2];
    const value = Math.round(red * 0.299 + green * 0.587 + blue * 0.114);
    const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);
    const frameDiff = previousGray ? Math.abs(value - previousGray[pixelIndex]) : 0;
    const bgDiff = Math.abs(value - background[pixelIndex]);

    gray[pixelIndex] = value;

    // Foreground = stands out from learned background. This is the primary signal.
    if (bgDiff > FOREGROUND_THRESHOLD) foregroundMask[pixelIndex] = 1;
    if (frameDiff > MOTION_THRESHOLD) motionMask[pixelIndex] = 1;
    if (value < DARK_THRESHOLD && saturation > SATURATION_THRESHOLD) beeToneMask[pixelIndex] = 1;

    // Adapt the background slowly toward the current frame so lighting changes don't drift.
    background[pixelIndex] = background[pixelIndex] * (1 - BACKGROUND_ALPHA) + value * BACKGROUND_ALPHA;
  }

  detectorState.previousGray = gray;
  detectorState.framesSeen += 1;

  // Warm-up phase: let the background stabilize before reporting detections.
  if (detectorState.framesSeen < WARMUP_FRAMES) {
    return { detections: [], sourceWidth, sourceHeight };
  }

  return {
    detections: findBeeCandidates(foregroundMask, motionMask, beeToneMask, sourceWidth, sourceHeight),
    sourceWidth,
    sourceHeight,
  };
}

const BEE_TONE_RATIO_THRESHOLD = 0.3;
const MIN_INSECT_AREA = 18;
const MIN_DENSITY = 0.32;
const MIN_ASPECT = 0.35;
const MAX_ASPECT = 3.2;

function findBeeCandidates(
  mask: Uint8Array,
  motionMask: Uint8Array,
  beeToneMask: Uint8Array,
  width: number,
  height: number,
) {
  const visited = new Uint8Array(mask.length);
  const detections: BeeDetection[] = [];
  const maxArea = Math.round(width * height * 0.025);

  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || visited[start]) continue;

    const stack = [start];
    visited[start] = 1;
    let area = 0;
    let motionArea = 0;
    let beeToneArea = 0;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;

    while (stack.length) {
      const current = stack.pop() as number;
      const x = current % width;
      const y = Math.floor(current / width);
      area += 1;
      motionArea += motionMask[current];
      beeToneArea += beeToneMask[current];
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);

      const neighbors = [current - 1, current + 1, current - width, current + width];
      for (const next of neighbors) {
        if (next < 0 || next >= mask.length || visited[next] || !mask[next]) continue;
        const nextX = next % width;
        if ((next === current - 1 && nextX > x) || (next === current + 1 && nextX < x)) continue;
        visited[next] = 1;
        stack.push(next);
      }
    }

    const boxWidth = maxX - minX + 1;
    const boxHeight = maxY - minY + 1;
    const density = area / Math.max(1, boxWidth * boxHeight);
    const aspect = boxWidth / Math.max(1, boxHeight);
    const centerX = (minX + boxWidth / 2) / width;
    const centerY = (minY + boxHeight / 2) / height;

    if (area < MIN_INSECT_AREA || area > maxArea) continue;
    if (boxWidth < 4 || boxHeight < 4 || boxWidth > 60 || boxHeight > 60) continue;
    if (density < MIN_DENSITY || aspect < MIN_ASPECT || aspect > MAX_ASPECT) continue;
    if (
      centerX < RADAR_ZONE.x ||
      centerX > RADAR_ZONE.x + RADAR_ZONE.width ||
      centerY < RADAR_ZONE.y ||
      centerY > RADAR_ZONE.y + RADAR_ZONE.height
    ) {
      continue;
    }
    // Foreground blob also needs recent motion; this cuts static lighting and shadow noise.
    if (motionArea / area < 0.18) continue;

    const moving = motionArea / area > 0.18;
    const isBee = beeToneArea / area >= BEE_TONE_RATIO_THRESHOLD;
    const score = Math.min(1, area / 180) * 0.35 + Math.min(1, motionArea / Math.max(1, area)) * 0.65;

    detections.push({
      id: `${minX}-${minY}-${area}`,
      x: minX,
      y: minY,
      width: boxWidth,
      height: boxHeight,
      score,
      moving,
      isBee,
    });
  }

  return detections
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_DETECTIONS);
}

function drawDetectionOverlay(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  analysis: FrameAnalysis | null,
) {
  const displayWidth = canvas.clientWidth || video.clientWidth;
  const displayHeight = canvas.clientHeight || video.clientHeight;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.max(1, Math.round(displayWidth * dpr));
  canvas.height = Math.max(1, Math.round(displayHeight * dpr));

  const context = canvas.getContext("2d");
  if (!context) return;

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, displayWidth, displayHeight);
  if (!video.videoWidth || !video.videoHeight) return;

  const videoAspect = video.videoWidth / video.videoHeight;
  const canvasAspect = displayWidth / displayHeight;
  let fittedWidth = displayWidth;
  let fittedHeight = displayHeight;
  let offsetX = 0;
  let offsetY = 0;

  if (canvasAspect > videoAspect) {
    fittedHeight = displayHeight;
    fittedWidth = fittedHeight * videoAspect;
    offsetX = (displayWidth - fittedWidth) / 2;
  } else {
    fittedWidth = displayWidth;
    fittedHeight = fittedWidth / videoAspect;
    offsetY = (displayHeight - fittedHeight) / 2;
  }

  context.font = "700 12px Inter, system-ui, sans-serif";
  context.textBaseline = "top";

  const radarX = offsetX + RADAR_ZONE.x * fittedWidth;
  const radarY = offsetY + RADAR_ZONE.y * fittedHeight;
  const radarWidth = RADAR_ZONE.width * fittedWidth;
  const radarHeight = RADAR_ZONE.height * fittedHeight;

  context.save();
  context.strokeStyle = "rgba(250, 204, 21, 0.9)";
  context.lineWidth = 2;
  context.setLineDash([8, 6]);
  context.strokeRect(radarX, radarY, radarWidth, radarHeight);
  context.setLineDash([]);
  context.fillStyle = "rgba(15, 23, 42, 0.72)";
  context.fillRect(radarX, Math.max(0, radarY - 24), 118, 20);
  context.fillStyle = "#fff";
  context.fillText("Radar de entrada", radarX + 8, Math.max(2, radarY - 21));
  context.restore();

  if (!analysis || !analysis.detections.length) return;

  for (const detection of analysis.detections) {
    const centerX = offsetX + ((detection.x + detection.width / 2) / analysis.sourceWidth) * fittedWidth;
    const centerY = offsetY + ((detection.y + detection.height / 2) / analysis.sourceHeight) * fittedHeight;
    const radius = Math.max(
      14,
      Math.max(
        (detection.width / analysis.sourceWidth) * fittedWidth,
        (detection.height / analysis.sourceHeight) * fittedHeight,
      ) * 0.72,
    );

    const color = detection.isBee ? "#22c55e" : "#ef4444";
    const label = detection.isBee ? "Abelha" : "Invasor";

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.lineWidth = 3;
    context.strokeStyle = color;
    context.stroke();

    context.fillStyle = detection.isBee ? "rgba(15, 23, 42, 0.78)" : "rgba(127, 29, 29, 0.85)";
    context.fillRect(centerX - radius, centerY - radius - 20, 80, 18);
    context.fillStyle = "#fff";
    context.fillText(label, centerX - radius + 6, centerY - radius - 17);
  }
}

export function SensorCelular() {
  const [searchParams] = useSearchParams();
  const requestedColmeiaId = searchParams.get("colmeia_id");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const snapshotCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const analysisTimerRef = useRef<number | null>(null);
  const fallbackSnapshotTimerRef = useRef<number | null>(null);
  const detectorStateRef = useRef<DetectorState>({ previousGray: null, background: null, framesSeen: 0 });
  const chunkStatsRef = useRef<ChunkStats>(cloneEmptyStats());
  const formRef = useRef({ colmeia_id: "", observacoes: "", possivel_invasor: false });
  const syncLockRef = useRef(false);
  const radarOccupiedRef = useRef(false);
  const lastRadarEventAtRef = useRef(0);

  const [colmeias, setColmeias] = useState<Colmeia[]>([]);
  const [selectedColmeiaId, setSelectedColmeiaId] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [possivelInvasor, setPossivelInvasor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [recordingMode, setRecordingMode] = useState<"video" | "snapshot" | "idle">("idle");
  const [detections, setDetections] = useState<BeeDetection[]>([]);
  const [radarEvents, setRadarEvents] = useState(0);
  const [beeFlowCount, setBeeFlowCount] = useState(0);
  const [invaderEventCount, setInvaderEventCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncedCount, setSyncedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [invaderDetected, setInvaderDetected] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    listarColmeias()
      .then((items) => {
        setColmeias(items);
        const selected = items.find((item) => item.id === requestedColmeiaId) ?? items[0];
        if (selected) setSelectedColmeiaId(selected.id);
      })
      .finally(() => setLoading(false));

    return () => stopCamera();
  }, [requestedColmeiaId]);

  useEffect(() => {
    formRef.current = {
      colmeia_id: selectedColmeiaId,
      observacoes,
      possivel_invasor: possivelInvasor,
    };
  }, [selectedColmeiaId, observacoes, possivelInvasor]);

  useEffect(() => {
    void refreshPendingCount();

    const handleOnline = () => {
      setOnline(true);
      void syncPendingCaptures();
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    const interval = window.setInterval(() => {
      setOnline(navigator.onLine);
      if (navigator.onLine) void syncPendingCaptures();
      else void refreshPendingCount();
    }, 20_000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.clearInterval(interval);
    };
  }, []);

  async function refreshPendingCount() {
    setPendingCount(await countCachedCameraCaptures());
  }

  async function syncPendingCaptures() {
    if (syncLockRef.current) return;
    syncLockRef.current = true;
    setSyncing(true);
    try {
      const result = await syncCachedCameraCaptures();
      if (result.sent) setSyncedCount((value) => value + result.sent);
      setPendingCount(result.remaining);
    } finally {
      setSyncing(false);
      syncLockRef.current = false;
    }
  }

  async function startCamera() {
    setCameraError(null);
    setMessage(null);

    if (!selectedColmeiaId) {
      setCameraError("Selecione uma colmeia para iniciar a camera.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera indisponivel neste navegador.");
      return;
    }

    try {
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

      detectorStateRef.current = { previousGray: null, background: null, framesSeen: 0 };
      chunkStatsRef.current = cloneEmptyStats();
      radarOccupiedRef.current = false;
      lastRadarEventAtRef.current = 0;
      setCameraActive(true);
      startAnalysisLoop();
      startContinuousCapture(stream);
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
    if (analysisTimerRef.current) {
      window.clearTimeout(analysisTimerRef.current);
      analysisTimerRef.current = null;
    }
    if (fallbackSnapshotTimerRef.current) {
      window.clearInterval(fallbackSnapshotTimerRef.current);
      fallbackSnapshotTimerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.requestData();
      recorderRef.current.stop();
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setCameraActive(false);
    setRecordingMode("idle");
    setDetections([]);
    setInvaderDetected(false);
    if (overlayCanvasRef.current && videoRef.current) {
      drawDetectionOverlay(overlayCanvasRef.current, videoRef.current, null);
    }
  }

  function startContinuousCapture(stream: MediaStream) {
    const mimeType = pickRecordingMimeType();

    if (mimeType && "MediaRecorder" in window) {
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          void handleCaptureBlob(event.data, recorder.mimeType || mimeType);
        }
      };
      recorder.onerror = () => {
        setRecordingMode("snapshot");
        startSnapshotFallback();
      };
      recorder.start(RECORDING_CHUNK_MS);
      setRecordingMode("video");
      return;
    }

    setRecordingMode("snapshot");
    startSnapshotFallback();
  }

  function startSnapshotFallback() {
    if (fallbackSnapshotTimerRef.current) window.clearInterval(fallbackSnapshotTimerRef.current);
    fallbackSnapshotTimerRef.current = window.setInterval(() => {
      void captureSnapshotBlob().then((blob) => {
        if (blob) void handleCaptureBlob(blob, "image/jpeg");
      });
    }, FALLBACK_SNAPSHOT_MS);
  }

  function startAnalysisLoop() {
    if (analysisTimerRef.current) window.clearTimeout(analysisTimerRef.current);

    const analyze = () => {
      const video = videoRef.current;
      const processingCanvas = processingCanvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;

      if (!video || !processingCanvas || !overlayCanvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        analysisTimerRef.current = window.setTimeout(analyze, ANALYSIS_INTERVAL_MS);
        return;
      }

      const analysis = analyzeFrame(video, processingCanvas, detectorStateRef.current);
      drawDetectionOverlay(overlayCanvas, video, analysis);

      const found = analysis?.detections ?? [];
      setDetections(found);

      if (found.length) {
        const now = Date.now();
        const canRegisterEvent =
          !radarOccupiedRef.current || now - lastRadarEventAtRef.current > RADAR_EVENT_COOLDOWN_MS;
        radarOccupiedRef.current = true;

        if (canRegisterEvent) {
          lastRadarEventAtRef.current = now;
          const primary = found[0];
          const stats = chunkStatsRef.current;
          stats.framesWithActivity += 1;
          stats.movementScore += 1;
          setRadarEvents((value) => value + 1);

          if (primary.isBee) {
            const beeCount = Math.max(1, found.filter((d) => d.isBee).length);
            stats.beeEntries += beeCount;
            setBeeFlowCount((value) => value + beeCount);
          } else {
            stats.possibleInvader = true;
            setInvaderDetected(true);
            setInvaderEventCount((value) => value + 1);
          }
        }
      } else {
        radarOccupiedRef.current = false;
      }

      analysisTimerRef.current = window.setTimeout(analyze, ANALYSIS_INTERVAL_MS);
    };

    analyze();
  }

  async function captureSnapshotBlob() {
    const video = videoRef.current;
    const canvas = snapshotCanvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return null;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.86);
    });
  }

  async function handleCaptureBlob(blob: Blob, contentType: string) {
    const currentForm = formRef.current;
    if (!currentForm.colmeia_id) return;

    const stats = chunkStatsRef.current;
    chunkStatsRef.current = cloneEmptyStats();

    const recordedAt = new Date().toISOString();
    const normalizedContentType = contentType || blob.type || "video/webm";
    const filename = `smarthive-camera-${Date.now()}.${extensionForContentType(normalizedContentType)}`;
    const payload: CameraCapturePayload = {
      colmeia_id: currentForm.colmeia_id,
      movimentos_estimados: stats.movementScore,
      abelhas_entrando: stats.beeEntries,
      abelhas_saindo: 0,
      possivel_invasor: currentForm.possivel_invasor || stats.possibleInvader,
      observacoes: buildObservation(currentForm.observacoes, stats, recordedAt, !navigator.onLine),
    };

    if (!navigator.onLine) {
      await cacheCapture(payload, blob, filename, normalizedContentType);
      return;
    }

    try {
      await registrarCapturaSensorCelular(createCaptureFormData(payload, blob, filename, normalizedContentType));
      setSyncedCount((value) => value + 1);
      if (pendingCount > 0) void syncPendingCaptures();
    } catch {
      await cacheCapture(payload, blob, filename, normalizedContentType);
    }
  }

  async function cacheCapture(payload: CameraCapturePayload, blob: Blob, filename: string, contentType: string) {
    await cacheCameraCapture({
      payload: {
        ...payload,
        observacoes: payload.observacoes?.replace("Captura sincronizada", "Cache offline"),
      },
      blob,
      filename,
      contentType,
    });
    setPendingCount(await countCachedCameraCaptures());
    setMessage("Sem conexao estavel. Captura guardada no cache do celular.");
  }

  function resetReading() {
    detectorStateRef.current = { previousGray: null, background: null, framesSeen: 0 };
    chunkStatsRef.current = cloneEmptyStats();
    radarOccupiedRef.current = false;
    lastRadarEventAtRef.current = 0;
    setDetections([]);
    setRadarEvents(0);
    setBeeFlowCount(0);
    setInvaderEventCount(0);
    setPossivelInvasor(false);
    setInvaderDetected(false);
    setMessage(null);
  }

  if (loading) return <LoadingState />;

  const beeDetections = detections.filter((d) => d.isBee);
  const invaderDetections = detections.filter((d) => !d.isBee);

  const statusText = invaderDetections.length
    ? `Alerta: ${invaderDetections.length} invasor(es) detectado(s)`
    : beeDetections.length
      ? `${beeDetections.length} abelha(s) em foco`
      : cameraActive
        ? "Monitorando entrada"
        : "Camera parada";

  const syncText = online ? (syncing ? "Sincronizando" : "Online") : "Offline";

  return (
    <>
      <PageHeader
        title="Camera IA"
        description="Monitoramento visual continuo com deteccao local e sincronizacao automatica."
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
                className="aspect-[4/3] w-full bg-black object-contain sm:aspect-video"
                playsInline
                muted
                autoPlay
              />
              <canvas ref={overlayCanvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
              {!cameraActive ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/92 p-6 text-center">
                  <div>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-hive-600 text-white">
                      <Camera className="h-8 w-8" />
                    </div>
                    <p className="text-lg font-bold text-white">Camera pronta</p>
                    <p className="mt-2 text-sm text-slate-300">Aponte para a entrada da colmeia.</p>
                  </div>
                </div>
              ) : null}
              <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                <Radio className="h-3.5 w-3.5" />
                {cameraActive ? "Ao vivo" : "Parado"}
              </div>
              <div className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                {online ? <Cloud className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
                {syncText}
              </div>
              <div
                className={`absolute bottom-3 left-3 right-3 rounded-xl px-4 py-3 text-white backdrop-blur ${
                  invaderDetections.length ? "bg-red-700/80" : "bg-black/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  <span className="font-bold">{statusText}</span>
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
                icon={cameraActive ? <Square className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              >
                {cameraActive ? "Parar camera" : "Abrir camera"}
              </Button>
              <Button type="button" variant="secondary" onClick={resetReading} icon={<RotateCcw className="h-4 w-4" />}>
                Reiniciar leitura
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void syncPendingCaptures()}
                disabled={syncing || pendingCount === 0}
                icon={<RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />}
              >
                Sincronizar
              </Button>
            </div>

            <canvas ref={processingCanvasRef} className="hidden" />
            <canvas ref={snapshotCanvasRef} className="hidden" />
          </div>

          <aside className="surface rounded-xl p-6">
            {invaderDetected ? (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>Possivel invasor detectado! A captura sera enviada com alerta.</span>
              </div>
            ) : null}
            {message ? (
              <p className="mb-4 rounded-lg bg-hive-50 px-4 py-3 text-sm font-semibold text-hive-700">{message}</p>
            ) : null}

            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">Operacao</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold text-slate-500">No radar</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{detections.length}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold text-slate-500">Fluxo</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{beeFlowCount}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold text-slate-500">Eventos</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{radarEvents}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold text-slate-500">Invasores</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{invaderEventCount}</p>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-bold text-slate-700">Enviados ao banco</span>
                  <span className="rounded-full bg-hive-50 px-3 py-1 text-xs font-bold text-hive-700">
                    {syncedCount}
                  </span>
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  {recordingMode === "video" ? "Video continuo" : recordingMode === "snapshot" ? "Fotos em cache" : "Aguardando camera"} - {pendingCount} em cache
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Colmeia
                <select
                  className="focus-ring rounded-lg border border-slate-200 bg-white px-3 py-2"
                  value={selectedColmeiaId}
                  onChange={(event) => setSelectedColmeiaId(event.target.value)}
                  disabled={cameraActive}
                  required
                >
                  {colmeias.map((colmeia) => (
                    <option key={colmeia.id} value={colmeia.id}>
                      {colmeia.nome} - {colmeia.especie}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-hive-600 focus:ring-hive-500"
                  checked={possivelInvasor}
                  onChange={(event) => setPossivelInvasor(event.target.checked)}
                />
                <span className="text-sm font-semibold text-slate-700">Possivel invasor</span>
              </label>

              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Observacoes
                <textarea
                  className="focus-ring min-h-28 rounded-lg border border-slate-200 bg-white px-3 py-2"
                  value={observacoes}
                  onChange={(event) => setObservacoes(event.target.value)}
                />
              </label>
            </div>
          </aside>
        </section>
      )}
    </>
  );
}

import { registrarCapturaSensorCelular } from "./sensorCelular";

const DB_NAME = "smarthive-camera-cache";
const STORE_NAME = "capturas";
const DB_VERSION = 1;

export type CameraCapturePayload = {
  colmeia_id: string;
  movimentos_estimados: number;
  abelhas_entrando: number;
  abelhas_saindo: number;
  possivel_invasor: boolean;
  observacoes?: string;
};

export type CachedCameraCapture = {
  id: string;
  createdAt: string;
  payload: CameraCapturePayload;
  blob: Blob;
  filename: string;
  contentType: string;
  attempts: number;
};

function openCameraDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runStore<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T> | void,
) {
  return openCameraDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        const request = action(store);

        transaction.oncomplete = () => {
          db.close();
          resolve(request && "result" in request ? request.result : (undefined as T));
        };
        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
      }),
  );
}

function createCacheId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function cacheCameraCapture(capture: Omit<CachedCameraCapture, "id" | "createdAt" | "attempts">) {
  const record: CachedCameraCapture = {
    ...capture,
    id: createCacheId(),
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  await runStore("readwrite", (store) => store.put(record));
  return record;
}

export async function countCachedCameraCaptures() {
  return runStore<number>("readonly", (store) => store.count());
}

export async function listCachedCameraCaptures() {
  return runStore<CachedCameraCapture[]>("readonly", (store) => store.getAll());
}

async function removeCachedCameraCapture(id: string) {
  await runStore("readwrite", (store) => store.delete(id));
}

async function incrementAttempts(record: CachedCameraCapture) {
  await runStore("readwrite", (store) => store.put({ ...record, attempts: record.attempts + 1 }));
}

function captureToFormData(record: CachedCameraCapture) {
  const formData = new FormData();
  formData.append("colmeia_id", record.payload.colmeia_id);
  formData.append("movimentos_estimados", String(record.payload.movimentos_estimados));
  formData.append("abelhas_entrando", String(record.payload.abelhas_entrando));
  formData.append("abelhas_saindo", String(record.payload.abelhas_saindo));
  formData.append("possivel_invasor", String(record.payload.possivel_invasor));
  formData.append("observacoes", record.payload.observacoes ?? "");
  formData.append("arquivo", new File([record.blob], record.filename, { type: record.contentType }));
  return formData;
}

export async function syncCachedCameraCaptures() {
  const records = await listCachedCameraCaptures();
  let sent = 0;

  for (const record of records) {
    try {
      await registrarCapturaSensorCelular(captureToFormData(record));
      await removeCachedCameraCapture(record.id);
      sent += 1;
    } catch {
      await incrementAttempts(record);
      break;
    }
  }

  return {
    sent,
    remaining: await countCachedCameraCaptures(),
  };
}

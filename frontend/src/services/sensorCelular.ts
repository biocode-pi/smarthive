import { api } from "./api";
import type { SensorCelularResposta } from "../types";

export async function registrarCapturaSensorCelular(formData: FormData) {
  const { data } = await api.post<SensorCelularResposta>("/sensor-celular/captura", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}


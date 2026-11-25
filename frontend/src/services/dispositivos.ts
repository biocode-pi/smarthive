import { API_BASE_URL, api } from "./api";
import type { Dispositivo, DispositivoCriado } from "../types";

export const ENDERECO_DE_CAPTURA = new URL(`${API_BASE_URL}/dispositivos/captura`, window.location.origin).toString();

export async function listarDispositivos(colmeiaId: string) {
  const { data } = await api.get<Dispositivo[]>(`/colmeias/${colmeiaId}/dispositivos`);
  return data;
}

export async function criarDispositivo(colmeiaId: string, nome: string) {
  const { data } = await api.post<DispositivoCriado>(`/colmeias/${colmeiaId}/dispositivos`, { nome });
  return data;
}

export async function revogarDispositivo(id: string) {
  await api.delete(`/dispositivos/${id}`);
}

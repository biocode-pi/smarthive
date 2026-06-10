import { api } from "./api";
import type { Colmeia, Monitoramento } from "../types";

export type ColmeiaPayload = Omit<Colmeia, "id" | "criado_em" | "atualizado_em">;

export async function listarColmeias() {
  const { data } = await api.get<Colmeia[]>("/colmeias");
  return data;
}

export async function obterColmeia(id: string) {
  const { data } = await api.get<Colmeia>(`/colmeias/${id}`);
  return data;
}

export async function criarColmeia(payload: ColmeiaPayload) {
  const { data } = await api.post<Colmeia>("/colmeias", payload);
  return data;
}

export async function atualizarColmeia(id: string, payload: Partial<ColmeiaPayload>) {
  const { data } = await api.put<Colmeia>(`/colmeias/${id}`, payload);
  return data;
}

export async function excluirColmeia(id: string) {
  await api.delete(`/colmeias/${id}`);
}

export async function listarMonitoramentosDaColmeia(id: string) {
  const { data } = await api.get<Monitoramento[]>(`/colmeias/${id}/monitoramentos`);
  return data;
}


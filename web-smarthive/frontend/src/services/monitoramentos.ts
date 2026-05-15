import { api } from "./api";
import type { Monitoramento } from "../types";

export async function listarMonitoramentos() {
  const { data } = await api.get<Monitoramento[]>("/monitoramentos");
  return data;
}

export async function criarMonitoramento(formData: FormData) {
  const { data } = await api.post<Monitoramento>("/monitoramentos", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function excluirMonitoramento(id: string) {
  await api.delete(`/monitoramentos/${id}`);
}


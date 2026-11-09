import { api } from "./api";
import type { Colmeia, Meliponario } from "../types";

export type MeliponarioPayload = Pick<Meliponario, "nome" | "endereco" | "cidade" | "uf" | "descricao">;

export async function listarMeliponarios(filtros: { busca?: string; comAlerta?: boolean } = {}) {
  const { data } = await api.get<Meliponario[]>("/meliponarios", {
    params: { busca: filtros.busca || undefined, com_alerta: filtros.comAlerta || undefined },
  });
  return data;
}

export async function obterMeliponario(id: string) {
  const { data } = await api.get<Meliponario>(`/meliponarios/${id}`);
  return data;
}

export async function listarColmeiasDoMeliponario(id: string) {
  const { data } = await api.get<Colmeia[]>(`/meliponarios/${id}/colmeias`);
  return data;
}

export async function criarMeliponario(payload: MeliponarioPayload) {
  const { data } = await api.post<Meliponario>("/meliponarios", payload);
  return data;
}

export async function atualizarMeliponario(id: string, payload: Partial<MeliponarioPayload>) {
  const { data } = await api.put<Meliponario>(`/meliponarios/${id}`, payload);
  return data;
}

export async function excluirMeliponario(id: string) {
  await api.delete(`/meliponarios/${id}`);
}

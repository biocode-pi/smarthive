import { api } from "./api";
import type { Alerta } from "../types";

export type AlertaPayload = Pick<
  Alerta,
  "titulo" | "mensagem" | "tipo" | "severidade" | "colmeia_id" | "monitoramento_id" | "resolvido"
>;

export async function listarAlertas() {
  const { data } = await api.get<Alerta[]>("/alertas");
  return data;
}

export async function criarAlerta(payload: AlertaPayload) {
  const { data } = await api.post<Alerta>("/alertas", payload);
  return data;
}

export async function resolverAlerta(id: string) {
  const { data } = await api.put<Alerta>(`/alertas/${id}/resolver`);
  return data;
}


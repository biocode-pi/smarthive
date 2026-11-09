import { api } from "./api";
import type { DashboardResumo } from "../types";

export async function obterResumoDashboard() {
  const { data } = await api.get<DashboardResumo>("/dashboard/resumo");
  return data;
}


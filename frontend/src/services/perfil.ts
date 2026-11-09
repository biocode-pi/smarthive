import { api } from "./api";

export interface Perfil {
  telefone: string | null;
  notificacoes_email: boolean;
  consentimento_em: string | null;
  revogado_em: string | null;
}

export async function obterPerfil() {
  const { data } = await api.get<Perfil>("/perfil");
  return data;
}

export async function atualizarPerfil(payload: { telefone?: string | null; notificacoes_email?: boolean }) {
  const { data } = await api.put<Perfil>("/perfil", payload);
  return data;
}

/*
 * No cadastro o usuario ainda nao esta autenticado, entao a API nao aceita o telefone e o
 * aceite de notificacoes. Guardamos no navegador e enviamos no primeiro login.
 */
const CHAVE_PENDENTE = "smarthive:perfil-pendente";

interface PerfilPendente {
  email: string;
  telefone: string | null;
  notificacoes_email: boolean;
}

export function guardarPerfilPendente(dados: PerfilPendente) {
  try {
    localStorage.setItem(CHAVE_PENDENTE, JSON.stringify(dados));
  } catch {
    // Sem armazenamento disponivel: o usuario pode preencher depois em Configuracoes.
  }
}

export async function enviarPerfilPendente(email: string) {
  let pendente: PerfilPendente | null = null;
  try {
    pendente = JSON.parse(localStorage.getItem(CHAVE_PENDENTE) ?? "null");
  } catch {
    return;
  }
  if (!pendente || pendente.email.toLowerCase() !== email.toLowerCase()) return;
  try {
    await atualizarPerfil({ telefone: pendente.telefone, notificacoes_email: pendente.notificacoes_email });
    localStorage.removeItem(CHAVE_PENDENTE);
  } catch {
    // Tenta de novo no proximo login.
  }
}

/** Formata enquanto digita: (11) 91234-5678. */
export function mascaraTelefone(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

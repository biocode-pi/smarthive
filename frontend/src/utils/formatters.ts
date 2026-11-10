export function formatDateTime(value?: string | null): string {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDate(value?: string | null): string {
  if (!value) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

export function formatNumber(value?: number | null): string {
  return new Intl.NumberFormat("pt-BR").format(value ?? 0);
}


export function formatSigned(value: number): string {
  return value > 0 ? `+${formatNumber(value)}` : formatNumber(value);
}

export function origemLabel(origem: string): string {
  if (origem === "sensor_celular") return "Celular";
  if (origem === "iot_futuro") return "Dispositivo";
  return "Manual";
}

export const severidadeLabel: Record<string, string> = { alta: "Alta", media: "Média", baixa: "Baixa" };

export const tipoAlertaLabel: Record<string, string> = {
  observacao: "Observação",
  possivel_invasor: "Possível invasor",
  baixa_atividade: "Baixa atividade",
  sistema: "Sistema",
};

export function textoObservacao(texto?: string | null): string {
  return (texto ?? "")
    .replace(/^IA: (.+?) identificado como "[^"]*" com (\d+%) de confiança\./gm, "Leitura automática: $1 na imagem ($2).")
    .replace(/^IA: nenhum alvo relevante identificado\..*$/gm, "Leitura automática: nenhuma abelha ou invasor na imagem.")
    .replace(/^IA: /gm, "Leitura automática: ")
    .trim();
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDate(value?: string | null): string {
  if (!value) return "Nao informado";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

export function formatNumber(value?: number | null): string {
  return new Intl.NumberFormat("pt-BR").format(value ?? 0);
}


import { cn } from "../../utils/classNames";
import type { StatusColmeia } from "../../types";

// Mesmos selos do app mobile: pastel com texto escuro (contraste AA).
const statusMap: Record<StatusColmeia, { label: string; className: string }> = {
  ativa: { label: "Em dia", className: "bg-status-ativa text-status-ativa-texto" },
  observacao: { label: "Em observação", className: "bg-status-observacao text-status-observacao-texto" },
  risco: { label: "Em risco", className: "bg-status-risco text-status-risco-texto" },
  inativa: { label: "Inativa", className: "bg-status-inativa text-ink" },
};

export function StatusBadge({ status }: { status: StatusColmeia }) {
  const item = statusMap[status];
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-3 py-0.5 text-xs font-bold uppercase", item.className)}>
      {item.label}
    </span>
  );
}


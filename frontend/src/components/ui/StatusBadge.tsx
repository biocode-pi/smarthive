import { cn } from "../../utils/classNames";
import type { StatusColmeia } from "../../types";

const statusMap: Record<StatusColmeia, { label: string; className: string }> = {
  ativa: {
    label: "Ativa",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  observacao: {
    label: "Em observacao",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  risco: {
    label: "Risco",
    className: "bg-rose-50 text-rose-700 ring-rose-200",
  },
  inativa: {
    label: "Inativa",
    className: "bg-slate-100 text-slate-600 ring-slate-200",
  },
};

export function StatusBadge({ status }: { status: StatusColmeia }) {
  const item = statusMap[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1", item.className)}>
      {item.label}
    </span>
  );
}


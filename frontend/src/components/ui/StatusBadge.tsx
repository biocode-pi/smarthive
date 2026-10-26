import { cn } from "../../utils/classNames";
import type { StatusColmeia } from "../../types";

const statusMap: Record<StatusColmeia, { label: string; className: string }> = {
  ativa: {
    label: "Ativa",
    className: "bg-hive-50 text-hive-700 ring-hive-200",
  },
  observacao: {
    label: "Em observação",
    className: "bg-honey-50 text-honey-700 ring-honey-200",
  },
  risco: {
    label: "Em risco",
    className: "bg-orange-50 text-orange-800 ring-orange-200",
  },
  inativa: {
    label: "Inativa",
    className: "bg-slate-100 text-slate-600 ring-slate-200",
  },
};

export function StatusBadge({ status }: { status: StatusColmeia }) {
  const item = statusMap[status];
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ring-1", item.className)}>
      {item.label}
    </span>
  );
}


import { CheckCircle2 } from "lucide-react";
import type { Alerta } from "../../types";
import { cn } from "../../utils/classNames";
import { formatDateTime } from "../../utils/formatters";
import { Button } from "./Button";

const severityClass = {
  baixa: "bg-sky-50 text-sky-700 ring-sky-200",
  media: "bg-amber-50 text-amber-700 ring-amber-200",
  alta: "bg-rose-50 text-rose-700 ring-rose-200",
};

interface AlertCardProps {
  alerta: Alerta;
  onResolve?: (id: string) => void;
}

export function AlertCard({ alerta, onResolve }: AlertCardProps) {
  return (
    <article className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-950">{alerta.titulo}</h3>
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold ring-1", severityClass[alerta.severidade])}>
              {alerta.severidade}
            </span>
            {alerta.resolvido ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                Resolvido
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-slate-500">{formatDateTime(alerta.criado_em)}</p>
        </div>
        {!alerta.resolvido && onResolve ? (
          <Button type="button" variant="secondary" icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => onResolve(alerta.id)}>
            Resolver
          </Button>
        ) : null}
      </div>
      {alerta.mensagem ? <p className="mt-4 text-sm leading-6 text-slate-600">{alerta.mensagem}</p> : null}
    </article>
  );
}


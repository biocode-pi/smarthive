import type { ReactNode } from "react";
import type { Alerta } from "../../types";
import { cn } from "../../utils/classNames";
import { formatDateTime, severidadeLabel, tipoAlertaLabel } from "../../utils/formatters";

const corSeveridade: Record<Alerta["severidade"], string> = {
  alta: "bg-status-risco-texto",
  media: "bg-hive-600",
  baixa: "bg-ink/30",
};

export function AlertaLinha({ alerta, colmeia, acao }: { alerta: Alerta; colmeia?: string; acao?: ReactNode }) {
  return (
    <li className="flex gap-4 border-b border-ink/10 py-4">
      <span className={cn("w-1 flex-shrink-0 rounded-full", corSeveridade[alerta.severidade])} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="rotulo">
          {severidadeLabel[alerta.severidade]} · {tipoAlertaLabel[alerta.tipo] ?? alerta.tipo}
          {colmeia ? ` · ${colmeia}` : ""}
        </p>
        <p className="mt-1 font-bold text-ink">{alerta.titulo}</p>
        {alerta.mensagem ? <p className="mt-1 text-sm leading-relaxed text-ink/70">{alerta.mensagem}</p> : null}
        <p className="mt-2 font-dados text-xs text-ink/55">{formatDateTime(alerta.criado_em)}</p>
      </div>
      {acao ? <div className="flex-shrink-0 self-center">{acao}</div> : null}
    </li>
  );
}

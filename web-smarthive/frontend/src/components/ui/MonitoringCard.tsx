import { Camera, MoveHorizontal } from "lucide-react";
import type { Monitoramento } from "../../types";
import { mediaUrl } from "../../services/api";
import { formatDateTime, formatNumber } from "../../utils/formatters";

export function MonitoringCard({ monitoramento }: { monitoramento: Monitoramento }) {
  const url = mediaUrl(monitoramento.midia_url);
  return (
    <article className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950">{formatDateTime(monitoramento.data_hora || monitoramento.criado_em)}</p>
          <p className="mt-1 text-sm text-slate-500">
            Origem: {monitoramento.origem === "sensor_celular" ? "sensor celular" : monitoramento.origem}
          </p>
        </div>
        {monitoramento.possivel_invasor ? (
          <span className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
            Possivel invasor
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-500">Fluxo</p>
          <p className="mt-1 text-xl font-bold text-slate-950">{formatNumber(monitoramento.fluxo_estimado)}</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-3">
          <p className="text-xs font-semibold text-emerald-700">Entrando</p>
          <p className="mt-1 text-xl font-bold text-emerald-900">{formatNumber(monitoramento.abelhas_entrando)}</p>
        </div>
        <div className="rounded-lg bg-amber-50 p-3">
          <p className="text-xs font-semibold text-amber-700">Saindo</p>
          <p className="mt-1 text-xl font-bold text-amber-900">{formatNumber(monitoramento.abelhas_saindo)}</p>
        </div>
      </div>

      {monitoramento.observacoes ? <p className="mt-4 text-sm leading-6 text-slate-600">{monitoramento.observacoes}</p> : null}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <span className="inline-flex items-center gap-2">
          <MoveHorizontal className="h-4 w-4" />
          {formatNumber(monitoramento.movimentos_estimados)} movimentos
        </span>
        {url ? (
          <a className="inline-flex items-center gap-2 font-semibold text-hive-700 hover:text-hive-800" href={url} target="_blank" rel="noreferrer">
            <Camera className="h-4 w-4" />
            Ver midia
          </a>
        ) : null}
      </div>
    </article>
  );
}


import type { Monitoramento } from "../../types";
import { mediaUrl } from "../../services/api";
import { formatDateTime, formatNumber, origemLabel, textoObservacao } from "../../utils/formatters";

export function RegistroLinha({ monitoramento, colmeia }: { monitoramento: Monitoramento; colmeia?: string }) {
  const url = mediaUrl(monitoramento.midia_url);
  const observacao = textoObservacao(monitoramento.observacoes);
  return (
    <li className="grid gap-x-6 gap-y-2 border-b border-ink/10 py-4 sm:grid-cols-[10rem_1fr_auto]">
      <div className="font-dados text-sm text-ink/70">
        <p className="text-ink">{formatDateTime(monitoramento.data_hora || monitoramento.criado_em)}</p>
        <p className="mt-0.5 text-xs">
          {colmeia ? `${colmeia} · ` : ""}
          {origemLabel(monitoramento.origem)}
        </p>
      </div>
      <div className="min-w-0">
        <p className="tabular font-dados text-ink">
          <span className="text-2xl font-medium">{formatNumber(monitoramento.fluxo_estimado ?? monitoramento.movimentos_estimados)}</span>
          <span className="ml-1.5 text-sm text-ink/60">mov.</span>
          <span className="ml-4 text-sm text-ink/70">
            ↓ {formatNumber(monitoramento.abelhas_entrando)} · ↑ {formatNumber(monitoramento.abelhas_saindo)}
          </span>
        </p>
        {observacao ? <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink/70">{observacao}</p> : null}
      </div>
      <div className="flex items-start gap-4 text-sm sm:justify-end">
        {monitoramento.possivel_invasor ? (
          <span className="font-bold text-status-risco-texto">Possível invasor</span>
        ) : null}
        {url ? (
          <a className="link-acao focus-ring" href={url} target="_blank" rel="noreferrer">
            Ver mídia
          </a>
        ) : null}
      </div>
    </li>
  );
}

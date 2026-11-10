import type { Monitoramento } from "../../types";
import { formatNumber, formatSigned } from "../../utils/formatters";

const W = 640;
const H = 220;
const P = 30;

function rotuloData(value?: string | null, reserva = 0) {
  const data = value ? new Date(value) : null;
  if (!data || Number.isNaN(data.getTime())) return `#${reserva}`;
  const dia = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(data);
  return `${dia} ${String(data.getHours()).padStart(2, "0")}h`;
}

/** Pontos da serie: as ultimas capturas, da mais antiga para a mais recente. */
export function serieDeFluxo(registros: Monitoramento[], quantidade = 8) {
  return registros
    .slice(0, quantidade)
    .reverse()
    .map((item, indice) => ({
      label: rotuloData(item.data_hora ?? item.criado_em, indice + 1),
      value: item.fluxo_estimado ?? (item.abelhas_entrando ?? 0) + (item.abelhas_saindo ?? 0),
    }));
}

/** Movimento por captura: linha preta sobre area mel, grade fina e numeros em Plex Mono. */
export function GraficoFluxo({ data }: { data: { label: string; value: number }[] }) {
  if (data.length < 2) {
    return (
      <p className="flex h-48 items-center justify-center rounded-[24px] border-2 border-dashed border-ink/20 px-6 text-center text-sm text-ink/60">
        O gráfico aparece a partir da segunda captura.
      </p>
    );
  }

  const max = Math.max(...data.map((item) => item.value), 1);
  const largura = W - P * 2;
  const altura = H - P * 2;
  const pontos = data.map((item, i) => ({
    ...item,
    x: P + (data.length === 1 ? largura / 2 : (i / (data.length - 1)) * largura),
    y: P + altura - (item.value / max) * altura,
  }));
  const linha = pontos.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${linha} L ${pontos[pontos.length - 1].x} ${H - P} L ${pontos[0].x} ${H - P} Z`;
  const descricao = data.map((item) => `${item.label}: ${item.value}`).join("; ");

  return (
    <svg className="h-auto w-full" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Movimento por captura. ${descricao}`}>
      {[0, 1, 2, 3].map((passo) => {
        const y = P + (passo / 3) * altura;
        return <line key={passo} x1={P} x2={W - P} y1={y} y2={y} stroke="#121515" strokeOpacity={0.1} />;
      })}
      <path d={area} fill="#ffcc00" opacity={0.55} />
      <path d={linha} fill="none" stroke="#121515" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} />
      {pontos.map((p, i) => {
        // So a primeira, a do meio e a ultima data: legiveis tambem no celular.
        const ultimo = pontos.length - 1;
        const comRotulo = i === 0 || i === ultimo || (pontos.length > 4 && i === Math.floor(ultimo / 2));
        return (
          <g key={`${p.label}-${p.x}`}>
            <circle cx={p.x} cy={p.y} r={4.5} fill="#ffffff" stroke="#121515" strokeWidth={2} />
            {comRotulo ? (
              <text
                x={p.x}
                y={H - 4}
                textAnchor={i === 0 ? "start" : i === ultimo ? "end" : "middle"}
                className="fill-ink/60 font-dados text-[15px]"
              >
                {p.label}
              </text>
            ) : null}
          </g>
        );
      })}
      <text x={P} y={16} className="fill-ink/60 font-dados text-[15px]">
        {formatNumber(max)} mov.
      </text>
    </svg>
  );
}

/** Quanto entrou e quanto saiu, numa barra so dividida pelas duas cores do grafico do app. */
export function BalancoFluxo({ entradas, saidas, invasores }: { entradas: number; saidas: number; invasores?: number }) {
  const total = Math.max(entradas + saidas, 1);
  const pctEntrada = Math.round((entradas / total) * 100);
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
        <div className="bg-chart-entrada" style={{ width: `${pctEntrada}%` }} />
        <div className="bg-chart-saida" style={{ width: `${entradas + saidas ? 100 - pctEntrada : 0}%` }} />
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-4">
        <div>
          <dt className="rotulo flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-chart-entrada" aria-hidden="true" /> Entraram
          </dt>
          <dd className="tabular mt-1 font-dados text-2xl font-medium text-ink">{formatNumber(entradas)}</dd>
        </div>
        <div>
          <dt className="rotulo flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-chart-saida" aria-hidden="true" /> Saíram
          </dt>
          <dd className="tabular mt-1 font-dados text-2xl font-medium text-ink">{formatNumber(saidas)}</dd>
        </div>
        <div>
          <dt className="rotulo">Saldo</dt>
          <dd className="tabular mt-1 font-dados text-2xl font-medium text-ink">{formatSigned(entradas - saidas)}</dd>
        </div>
      </dl>
      {invasores ? (
        <p className="mt-4 text-sm font-bold text-status-risco-texto">
          {invasores} {invasores === 1 ? "captura com possível invasor" : "capturas com possível invasor"}
        </p>
      ) : null}
    </div>
  );
}

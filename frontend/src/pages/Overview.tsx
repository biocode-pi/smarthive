import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Camera,
  CheckCircle2,
  Clock3,
  Flower2,
  Gauge,
  PlusCircle,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHeader } from "../components/ui/PageHeader";
import { obterResumoDashboard } from "../services/dashboard";
import type { DashboardResumo, Monitoramento } from "../types";
import { formatDateTime, formatNumber } from "../utils/formatters";

type MetricCardProps = {
  label: string;
  value: string | number;
  detail: string;
  icon: ReactNode;
};

type StatusItem = {
  label: string;
  value: number;
  className: string;
};

const chartWidth = 640;
const chartHeight = 220;
const chartPadding = 28;

export function Overview() {
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obterResumoDashboard()
      .then(setResumo)
      .catch(() => setError("Nao foi possivel carregar os dados do SmartHive."))
      .finally(() => setLoading(false));
  }, []);

  const indicadores = useMemo(() => {
    const registros = resumo?.ultimos_monitoramentos ?? [];
    const totais = registros.reduce(
      (acc, item) => {
        acc.entradas += item.abelhas_entrando ?? 0;
        acc.saidas += item.abelhas_saindo ?? 0;
        acc.movimentos += item.movimentos_estimados ?? item.fluxo_estimado ?? 0;
        acc.fluxo += item.fluxo_estimado ?? (item.abelhas_entrando ?? 0) + (item.abelhas_saindo ?? 0);
        acc.invasores += item.possivel_invasor ? 1 : 0;
        return acc;
      },
      { entradas: 0, saidas: 0, movimentos: 0, fluxo: 0, invasores: 0 },
    );

    const mediaFluxo = registros.length ? Math.round(totais.fluxo / registros.length) : 0;
    const saldoFluxo = totais.entradas - totais.saidas;
    const semRisco = Math.max((resumo?.total_colmeias ?? 0) - (resumo?.colmeias_em_risco ?? 0), 0);

    return { ...totais, mediaFluxo, saldoFluxo, semRisco, registros };
  }, [resumo]);

  if (loading) return <LoadingState />;

  if (error || !resumo) {
    return (
      <EmptyState
        icon={<AlertTriangle className="h-6 w-6" />}
        title="API indisponivel"
        description={error ?? "Sem dados para exibir."}
      />
    );
  }

  const statusItems: StatusItem[] = [
    { label: "Ativas", value: resumo.colmeias_ativas, className: "bg-emerald-600" },
    { label: "Observacao", value: resumo.colmeias_em_observacao, className: "bg-sky-500" },
    { label: "Risco", value: resumo.colmeias_em_risco, className: "bg-rose-500" },
    {
      label: "Inativas",
      value: Math.max(
        resumo.total_colmeias - resumo.colmeias_ativas - resumo.colmeias_em_observacao - resumo.colmeias_em_risco,
        0,
      ),
      className: "bg-slate-400",
    },
  ].filter((item) => item.value > 0 || item.label !== "Inativas");

  const totalStatus = Math.max(statusItems.reduce((total, item) => total + item.value, 0), 1);
  const fluxoTotal = Math.max(indicadores.entradas + indicadores.saidas, 1);
  const entradasPercent = Math.round((indicadores.entradas / fluxoTotal) * 100);
  const saidasPercent = Math.round((indicadores.saidas / fluxoTotal) * 100);
  const lineData = buildLineData(indicadores.registros);
  const barData = buildBarData(indicadores.registros);

  return (
    <>
      <PageHeader
        title="Visao geral"
        description="Operacao das colmeias, fluxo visual recente e pendencias de campo."
      >
        <div className="flex flex-wrap gap-2">
          <Link
            to="/registros"
            className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            <Clock3 className="h-4 w-4" />
            Historico
          </Link>
          <Link
            to="/sensor-celular"
            className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-hive-700 bg-hive-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-hive-900"
          >
            <Camera className="h-4 w-4" />
            Nova captura
          </Link>
        </div>
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Colmeias monitoradas"
          value={formatNumber(resumo.total_colmeias)}
          detail={`${formatNumber(indicadores.semRisco)} sem risco aberto`}
          icon={<Flower2 className="h-5 w-5" />}
        />
        <MetricCard
          label="Registros processados"
          value={formatNumber(resumo.monitoramentos_realizados)}
          detail={`${formatNumber(indicadores.registros.length)} exibidos nesta leitura`}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <MetricCard
          label="Fluxo medio recente"
          value={formatNumber(indicadores.mediaFluxo)}
          detail={`Saldo ${formatSigned(indicadores.saldoFluxo)} no periodo`}
          icon={<Gauge className="h-5 w-5" />}
        />
        <MetricCard
          label="Alertas abertos"
          value={formatNumber(resumo.alertas_abertos)}
          detail={resumo.alertas_abertos ? "Requer revisao de campo" : "Sem pendencia critica"}
          icon={<ShieldAlert className="h-5 w-5" />}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="surface rounded-lg p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-950">Atividade recente</h2>
              <p className="mt-1 text-sm text-slate-500">Fluxo estimado nos ultimos monitoramentos recebidos.</p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
              <Activity className="h-3.5 w-3.5" />
              {formatNumber(indicadores.movimentos)} movimentos
            </div>
          </div>

          <LineChart data={lineData} />
        </div>

        <div className="surface rounded-lg p-5">
          <div>
            <h2 className="text-base font-bold text-slate-950">Status do apiario</h2>
            <p className="mt-1 text-sm text-slate-500">Distribuicao atual das colmeias cadastradas.</p>
          </div>

          <div className="mt-5 space-y-4">
            {statusItems.map((item) => {
              const percent = Math.round((item.value / totalStatus) * 100);
              return (
                <div key={item.label}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-700">{item.label}</span>
                    <span className="font-bold text-slate-950">
                      {formatNumber(item.value)} <span className="font-medium text-slate-500">{percent}%</span>
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${item.className}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
            <CompactFigure label="Ativas" value={resumo.colmeias_ativas} tone="text-emerald-700" />
            <CompactFigure label="Em risco" value={resumo.colmeias_em_risco} tone="text-rose-700" />
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="surface rounded-lg p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-950">Entrada e saida</h2>
              <p className="mt-1 text-sm text-slate-500">Balanco agregado dos ultimos registros.</p>
            </div>
            <Link
              to="/monitoramentos/novo"
              className="focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              <PlusCircle className="h-4 w-4" />
              Registro
            </Link>
          </div>

          <div className="mt-6 space-y-5">
            <FlowRow
              label="Entrando"
              value={indicadores.entradas}
              percent={entradasPercent}
              icon={<ArrowDown className="h-4 w-4" />}
              className="bg-emerald-600"
            />
            <FlowRow
              label="Saindo"
              value={indicadores.saidas}
              percent={saidasPercent}
              icon={<ArrowUp className="h-4 w-4" />}
              className="bg-sky-500"
            />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5">
            <CompactFigure label="Saldo" value={formatSigned(indicadores.saldoFluxo)} tone="text-slate-950" />
            <CompactFigure label="Invasores" value={indicadores.invasores} tone="text-rose-700" />
            <CompactFigure label="Sensor" value={resumo.sensor_celular.ativo ? "Ativo" : "Pausado"} tone="text-hive-700" />
          </div>
        </div>

        <div className="surface rounded-lg p-5">
          <div>
            <h2 className="text-base font-bold text-slate-950">Registros por captura</h2>
            <p className="mt-1 text-sm text-slate-500">Comparativo de movimentos por monitoramento recente.</p>
          </div>
          <BarChart data={barData} />
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="surface rounded-lg p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-950">Ultimos eventos</h2>
              <p className="mt-1 text-sm text-slate-500">Leituras recentes ja normalizadas pelo backend.</p>
            </div>
            <Link className="text-sm font-semibold text-hive-700 hover:text-hive-900" to="/registros">
              Ver todos
            </Link>
          </div>

          {indicadores.registros.length ? (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">Horario</th>
                    <th className="px-4 py-3 text-left font-bold">Fluxo</th>
                    <th className="px-4 py-3 text-left font-bold">Mov.</th>
                    <th className="px-4 py-3 text-left font-bold">Origem</th>
                  </tr>
                </thead>
                <tbody>
                  {indicadores.registros.slice(0, 5).map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-700">{formatDateTime(item.data_hora ?? item.criado_em)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-950">{formatNumber(item.fluxo_estimado)}</td>
                      <td className="px-4 py-3 text-slate-700">{formatNumber(item.movimentos_estimados)}</td>
                      <td className="px-4 py-3 text-slate-600">{originLabel(item.origem)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<TrendingUp className="h-6 w-6" />}
              title="Sem monitoramentos recentes"
              description="Quando uma captura for registrada, ela aparece neste quadro."
            />
          )}
        </div>

        <div className="surface rounded-lg p-5">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-950">Pendencias</h2>
            <p className="mt-1 text-sm text-slate-500">Alertas recentes que ainda orientam a rotina.</p>
          </div>

          {resumo.alertas_recentes.length ? (
            <div className="space-y-3">
              {resumo.alertas_recentes.slice(0, 4).map((alerta) => (
                <div key={alerta.id} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{alerta.titulo}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{alerta.mensagem ?? "Sem descricao."}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${alertTone(alerta.severidade)}`}>
                      {alerta.severidade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                <p className="text-sm font-semibold text-emerald-900">Nenhum alerta recente aberto.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function MetricCard({ label, value, detail, icon }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-hive-700">{icon}</div>
      </div>
      <p className="mt-4 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

function CompactFigure({ label, value, tone }: { label: string; value: ReactNode; tone: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function FlowRow({
  label,
  value,
  percent,
  icon,
  className,
}: {
  label: string;
  value: number;
  percent: number;
  icon: ReactNode;
  className: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-sm font-bold text-slate-950">{formatNumber(value)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${className}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function LineChart({ data }: { data: { label: string; value: number }[] }) {
  if (!data.length) {
    return (
      <div className="mt-6 flex h-56 items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm font-semibold text-slate-400">
        Sem dados suficientes para plotar a serie.
      </div>
    );
  }

  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const usableWidth = chartWidth - chartPadding * 2;
  const usableHeight = chartHeight - chartPadding * 2;
  const points = data.map((item, index) => {
    const x = chartPadding + (data.length === 1 ? usableWidth : (index / (data.length - 1)) * usableWidth);
    const y = chartPadding + usableHeight - (item.value / maxValue) * usableHeight;
    return { ...item, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const area = `${path} L ${points[points.length - 1].x} ${chartHeight - chartPadding} L ${points[0].x} ${
    chartHeight - chartPadding
  } Z`;

  return (
    <div className="mt-5">
      <svg className="h-64 w-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Serie de fluxo">
        {[0, 1, 2, 3].map((step) => {
          const y = chartPadding + (step / 3) * usableHeight;
          return <line key={step} x1={chartPadding} x2={chartWidth - chartPadding} y1={y} y2={y} stroke="#e2e8f0" />;
        })}
        <path d={area} fill="#dcfce7" opacity="0.65" />
        <path d={path} fill="none" stroke="#166534" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        {points.map((point) => (
          <g key={`${point.label}-${point.x}`}>
            <circle cx={point.x} cy={point.y} r="4.5" fill="#ffffff" stroke="#166534" strokeWidth="2" />
            <text x={point.x} y={chartHeight - 8} textAnchor="middle" className="fill-slate-500 text-[11px]">
              {point.label}
            </text>
          </g>
        ))}
        <text x={chartPadding} y="16" className="fill-slate-500 text-[11px]">
          {formatNumber(maxValue)}
        </text>
      </svg>
    </div>
  );
}

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  if (!data.length) {
    return (
      <div className="mt-6 flex h-56 items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm font-semibold text-slate-400">
        Sem capturas recentes.
      </div>
    );
  }

  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="mt-6 flex h-56 items-end gap-3 border-b border-slate-200 pb-2">
      {data.map((item) => {
        const height = Math.max((item.value / maxValue) * 100, 6);
        return (
          <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex h-40 w-full items-end rounded-t-md bg-slate-50">
              <div
                className="w-full rounded-t-md bg-slate-700"
                style={{ height: `${height}%` }}
                title={`${item.label}: ${formatNumber(item.value)}`}
              />
            </div>
            <p className="w-full truncate text-center text-xs font-semibold text-slate-500">{item.label}</p>
          </div>
        );
      })}
    </div>
  );
}

function buildLineData(registros: Monitoramento[]) {
  return registros
    .slice(0, 7)
    .reverse()
    .map((item, index) => ({
      label: shortDateLabel(item.data_hora ?? item.criado_em, index + 1),
      value: item.fluxo_estimado ?? (item.abelhas_entrando ?? 0) + (item.abelhas_saindo ?? 0),
    }));
}

function buildBarData(registros: Monitoramento[]) {
  return registros
    .slice(0, 6)
    .reverse()
    .map((item, index) => ({
      label: shortDateLabel(item.data_hora ?? item.criado_em, index + 1),
      value: item.movimentos_estimados ?? item.fluxo_estimado ?? 0,
    }));
}

function shortDateLabel(value?: string | null, fallback?: number) {
  if (!value) return `R${fallback ?? 0}`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return `R${fallback ?? 0}`;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
}

function formatSigned(value: number) {
  if (value > 0) return `+${formatNumber(value)}`;
  return formatNumber(value);
}

function originLabel(value: string) {
  if (value === "sensor_celular") return "Celular";
  if (value === "iot_futuro") return "IoT";
  return "Manual";
}

function alertTone(severidade: string) {
  if (severidade === "alta") return "bg-rose-50 text-rose-700";
  if (severidade === "media") return "bg-sky-50 text-sky-700";
  return "bg-slate-100 text-slate-700";
}

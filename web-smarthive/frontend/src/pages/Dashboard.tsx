import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Camera,
  Flame,
  LineChart as LineChartIcon,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertCard } from "../components/ui/AlertCard";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingState } from "../components/ui/LoadingState";
import { MonitoringCard } from "../components/ui/MonitoringCard";
import { PageHeader } from "../components/ui/PageHeader";
import { obterResumoDashboard } from "../services/dashboard";
import type {
  DashboardResumo,
  DistribuicaoItem,
  MapaCalorCelula,
} from "../types";

const COR_PRIMARIA = "#1f7a4c";
const COR_SECUNDARIA = "#d99a14";
const COR_ALERTA = "#dc2626";
const COR_NEUTRA = "#475569";

const COR_STATUS: Record<string, string> = {
  ativa: COR_PRIMARIA,
  observacao: COR_SECUNDARIA,
  risco: COR_ALERTA,
  inativa: "#94a3b8",
};

const COR_SEVERIDADE: Record<string, string> = {
  baixa: "#16a34a",
  media: "#d97706",
  alta: COR_ALERTA,
};

const COR_ORIGEM: Record<string, string> = {
  manual: COR_NEUTRA,
  sensor_celular: COR_PRIMARIA,
  iot_futuro: COR_SECUNDARIA,
};

const ROTULO_STATUS: Record<string, string> = {
  ativa: "Ativas",
  observacao: "Observacao",
  risco: "Risco",
  inativa: "Inativas",
};

const ROTULO_ORIGEM: Record<string, string> = {
  manual: "Manual",
  sensor_celular: "Camera",
  iot_futuro: "IoT (futuro)",
};

const ROTULO_SEVERIDADE: Record<string, string> = {
  baixa: "Baixa",
  media: "Media",
  alta: "Alta",
};

export function Dashboard() {
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obterResumoDashboard()
      .then(setResumo)
      .catch(() => setError("Nao foi possivel carregar o dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  if (error || !resumo) {
    return (
      <EmptyState
        icon={<AlertTriangle className="h-6 w-6" />}
        title="Dashboard indisponivel"
        description={error ?? "Sem dados para exibir."}
      />
    );
  }

  return (
    <>
      <PageHeader title="Dashboard" description="Visao consolidada do SmartHive: fluxo, saude das colmeias e alertas.">
        <Link
          to="/registros"
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
        >
          <LineChartIcon className="h-4 w-4" />
          Ver historico
        </Link>
        <Link
          to="/sensor-celular"
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Camera className="h-4 w-4" />
          Camera IA
        </Link>
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Colmeias monitoradas"
          value={resumo.total_colmeias}
          hint={`${resumo.colmeias_ativas} ativas`}
          icon={<Sparkles className="h-5 w-5" />}
          tone="primary"
        />
        <KpiCard
          label="Entradas / Saidas"
          value={`${resumo.entradas} / ${resumo.saidas}`}
          hint={`Saldo ${resumo.entradas - resumo.saidas}`}
          icon={<Activity className="h-5 w-5" />}
          tone="secondary"
        />
        <KpiCard
          label="Movimentos detectados"
          value={resumo.movimentos_acumulados}
          hint={`${resumo.monitoramentos_realizados} monitoramentos`}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="neutral"
        />
        <KpiCard
          label="Alertas abertos"
          value={resumo.alertas_abertos}
          hint={`${resumo.colmeias_em_risco} colmeia(s) em risco`}
          icon={<ShieldAlert className="h-5 w-5" />}
          tone={resumo.alertas_abertos > 0 ? "danger" : "primary"}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <ChartCard
          title="Fluxo dos ultimos 14 dias"
          subtitle="Soma de entradas e saidas por dia, com area de movimentos visuais."
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={resumo.serie_diaria} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradFluxo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COR_PRIMARIA} stopOpacity={0.45} />
                  <stop offset="95%" stopColor={COR_PRIMARIA} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradMov" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COR_SECUNDARIA} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={COR_SECUNDARIA} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 6" vertical={false} />
              <XAxis dataKey="rotulo" stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={11} width={32} />
              <Tooltip content={<TooltipMin />} />
              <Area
                type="monotone"
                dataKey="movimentos"
                stroke={COR_SECUNDARIA}
                strokeWidth={2}
                fill="url(#gradMov)"
                name="Movimentos"
              />
              <Area
                type="monotone"
                dataKey="fluxo"
                stroke={COR_PRIMARIA}
                strokeWidth={2}
                fill="url(#gradFluxo)"
                name="Fluxo (entradas+saidas)"
              />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Perfil da operacao"
          subtitle="Indicadores compostos em formato de teia para uma leitura rapida."
        >
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={resumo.perfil_teia} outerRadius="78%">
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metrica" tick={{ fill: "#475569", fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} stroke="#cbd5e1" />
              <Radar
                name="Indice"
                dataKey="valor"
                stroke={COR_PRIMARIA}
                fill={COR_PRIMARIA}
                fillOpacity={0.28}
                strokeWidth={2}
              />
              <Tooltip content={<TooltipMin sufixo="/100" />} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-3">
        <ChartCard title="Status das colmeias" subtitle="Distribuicao por estado operacional.">
          <DonutChart items={resumo.distribuicao_status} cores={COR_STATUS} rotulos={ROTULO_STATUS} />
        </ChartCard>

        <ChartCard title="Origem dos monitoramentos" subtitle="Como cada registro foi capturado.">
          <DonutChart items={resumo.distribuicao_origem} cores={COR_ORIGEM} rotulos={ROTULO_ORIGEM} />
        </ChartCard>

        <ChartCard title="Severidade dos alertas" subtitle="Distribuicao dos alertas registrados.">
          <DonutChart items={resumo.distribuicao_severidade} cores={COR_SEVERIDADE} rotulos={ROTULO_SEVERIDADE} />
        </ChartCard>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ChartCard
          title="Mapa de calor de atividade"
          subtitle="Numero de monitoramentos por dia da semana e hora."
          tag={<Flame className="h-4 w-4 text-rose-500" />}
        >
          <Heatmap cells={resumo.mapa_calor} />
        </ChartCard>

        <ChartCard
          title="Top colmeias por fluxo"
          subtitle="Soma de entradas + saidas registradas em cada colmeia."
        >
          {resumo.top_colmeias.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={resumo.top_colmeias}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
              >
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 6" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="nome"
                  stroke="#475569"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={140}
                />
                <Tooltip content={<TooltipMin />} />
                <Bar dataKey="fluxo" name="Fluxo" radius={[0, 6, 6, 0]}>
                  {resumo.top_colmeias.map((item) => (
                    <Cell key={item.id} fill={COR_STATUS[item.status] ?? COR_PRIMARIA} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={<Activity className="h-6 w-6" />}
              title="Sem dados de fluxo"
              description="Capture monitoramentos para popular o ranking."
            />
          )}
        </ChartCard>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Monitoramentos recentes</h2>
            <Link className="text-sm font-semibold text-hive-700 hover:text-hive-800" to="/sensor-celular">
              Registrar pela camera
            </Link>
          </div>
          <div className="space-y-4">
            {resumo.ultimos_monitoramentos.length ? (
              resumo.ultimos_monitoramentos.map((monitoramento) => (
                <MonitoringCard key={monitoramento.id} monitoramento={monitoramento} />
              ))
            ) : (
              <EmptyState
                icon={<LineChartIcon className="h-6 w-6" />}
                title="Nenhum monitoramento registrado"
                description="Use a camera do celular para iniciar o historico."
              />
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-bold text-slate-900">Alertas recentes</h2>
          <div className="space-y-4">
            {resumo.alertas_recentes.length ? (
              resumo.alertas_recentes.map((alerta) => <AlertCard key={alerta.id} alerta={alerta} />)
            ) : (
              <EmptyState
                icon={<AlertTriangle className="h-6 w-6" />}
                title="Sem alertas recentes"
                description="Riscos e observacoes aparecem aqui."
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}

type KpiTone = "primary" | "secondary" | "danger" | "neutral";

function KpiCard({
  label,
  value,
  hint,
  icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
  tone?: KpiTone;
}) {
  const tones: Record<KpiTone, string> = {
    primary: "bg-hive-50 text-hive-700",
    secondary: "bg-honey-100 text-honey-500",
    danger: "bg-rose-50 text-rose-600",
    neutral: "bg-slate-100 text-slate-600",
  };
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  tag,
  children,
}: {
  title: string;
  subtitle?: string;
  tag?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {tag}
            <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
          </div>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

function DonutChart({
  items,
  cores,
  rotulos,
}: {
  items: DistribuicaoItem[];
  cores: Record<string, string>;
  rotulos: Record<string, string>;
}) {
  const dados = items
    .filter((item) => item.total > 0)
    .map((item) => ({
      ...item,
      cor: cores[item.categoria] ?? COR_NEUTRA,
      label: rotulos[item.categoria] ?? item.categoria,
    }));
  const total = dados.reduce((acc, item) => acc + item.total, 0);

  if (!total) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
        Sem dados ainda.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="55%" height={220}>
        <PieChart>
          <Pie
            data={dados}
            dataKey="total"
            nameKey="label"
            innerRadius={55}
            outerRadius={88}
            paddingAngle={2}
            stroke="none"
          >
            {dados.map((item) => (
              <Cell key={item.categoria} fill={item.cor} />
            ))}
          </Pie>
          <Tooltip content={<TooltipMin />} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex-1 space-y-2 text-sm">
        {dados.map((item) => (
          <li key={item.categoria} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-slate-700">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.cor }} />
              {item.label}
            </span>
            <span className="font-semibold text-slate-900">{item.total}</span>
          </li>
        ))}
        <li className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-xs uppercase tracking-wider text-slate-400">
          <span>Total</span>
          <span>{total}</span>
        </li>
      </ul>
    </div>
  );
}

function Heatmap({ cells }: { cells: MapaCalorCelula[] }) {
  const maxValor = useMemo(() => Math.max(1, ...cells.map((c) => c.total)), [cells]);
  const dias = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
  const indiceDia = (dia: string) => dias.indexOf(dia);
  const ordenadas = [...cells].sort((a, b) => indiceDia(a.dia) - indiceDia(b.dia) || a.hora - b.hora);
  const horasMarco = [0, 6, 12, 18];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[28px_repeat(24,1fr)] gap-[3px]">
        <div />
        {Array.from({ length: 24 }, (_, hora) => (
          <span
            key={`h-${hora}`}
            className="text-[9px] font-medium uppercase text-slate-400"
            style={{ visibility: horasMarco.includes(hora) ? "visible" : "hidden" }}
          >
            {hora.toString().padStart(2, "0")}
          </span>
        ))}

        {dias.map((dia) => (
          <Row key={dia} dia={dia} cells={ordenadas.filter((c) => c.dia === dia)} max={maxValor} />
        ))}
      </div>

      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-400">
        <span>Menos</span>
        {[0.1, 0.3, 0.5, 0.75, 1].map((opacidade) => (
          <span
            key={opacidade}
            className="h-3 w-5 rounded-sm"
            style={{ backgroundColor: `rgba(31, 122, 76, ${opacidade})` }}
          />
        ))}
        <span>Mais</span>
      </div>
    </div>
  );
}

function Row({ dia, cells, max }: { dia: string; cells: MapaCalorCelula[]; max: number }) {
  return (
    <>
      <span className="text-[10px] font-semibold uppercase text-slate-500">{dia}</span>
      {cells.map((cell) => {
        const intensidade = cell.total / max;
        const cor =
          cell.total === 0
            ? "#f1f5f9"
            : `rgba(31, 122, 76, ${Math.max(0.15, Math.min(intensidade, 1))})`;
        return (
          <span
            key={`${cell.dia}-${cell.hora}`}
            className="aspect-square rounded-[2px]"
            style={{ backgroundColor: cor }}
            title={`${cell.dia} ${cell.hora.toString().padStart(2, "0")}h - ${cell.total} monitoramento(s)`}
          />
        );
      })}
    </>
  );
}

interface TooltipPayload {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string; payload?: Record<string, unknown> }>;
  label?: string | number;
}

function TooltipMin({ active, payload, label, sufixo = "" }: TooltipPayload & { sufixo?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-soft">
      {label !== undefined && label !== "" ? (
        <p className="mb-1 font-semibold text-slate-900">{String(label)}</p>
      ) : null}
      {payload.map((item, index) => (
        <p key={index} className="flex items-center gap-2 text-slate-600">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color ?? COR_PRIMARIA }} />
          <span className="font-medium text-slate-700">{item.name ?? "Valor"}</span>
          <span className="ml-auto font-semibold text-slate-900">
            {item.value}
            {sufixo}
          </span>
        </p>
      ))}
    </div>
  );
}

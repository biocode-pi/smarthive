import { AlertTriangle, ArrowDown, ArrowUp, Camera, LineChart, PlusCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCard } from "../components/ui/AlertCard";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingState } from "../components/ui/LoadingState";
import { MonitoringCard } from "../components/ui/MonitoringCard";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { obterResumoDashboard } from "../services/dashboard";
import type { DashboardResumo } from "../types";

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

  const fluxo = useMemo(() => {
    const registros = resumo?.ultimos_monitoramentos ?? [];
    return registros.reduce(
      (acc, item) => {
        acc.entradas += item.abelhas_entrando ?? 0;
        acc.saidas += item.abelhas_saindo ?? 0;
        acc.movimentos += item.movimentos_estimados ?? item.fluxo_estimado ?? 0;
        acc.invasores += item.possivel_invasor ? 1 : 0;
        return acc;
      },
      { entradas: 0, saidas: 0, movimentos: 0, invasores: 0 },
    );
  }, [resumo]);

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

  const totalFluxo = Math.max(fluxo.entradas + fluxo.saidas, 1);
  const entradaPercent = Math.round((fluxo.entradas / totalFluxo) * 100);
  const saidaPercent = Math.round((fluxo.saidas / totalFluxo) * 100);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Metricas de atividade, fluxo visual e alertas do SmartHive."
      >
        <Link
          to="/registros"
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
        >
          <LineChart className="h-4 w-4" />
          Ver historico
        </Link>
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Entradas" value={fluxo.entradas} icon={<ArrowDown className="h-5 w-5" />} />
        <StatCard label="Saidas" value={fluxo.saidas} icon={<ArrowUp className="h-5 w-5" />} />
        <StatCard label="Movimentos" value={fluxo.movimentos} icon={<LineChart className="h-5 w-5" />} />
        <StatCard label="Possiveis invasores" value={fluxo.invasores} icon={<AlertTriangle className="h-5 w-5" />} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="surface rounded-xl p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Resumo de atividade</h2>
              <p className="mt-1 text-sm text-slate-500">Ultimos registros processados pelo backend.</p>
            </div>
            <Link
              to="/sensor-celular"
              className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-hive-600 bg-hive-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-hive-700"
            >
              <Camera className="h-4 w-4" />
              Camera IA
            </Link>
          </div>

          <div className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                <span>Entradas</span>
                <span>{fluxo.entradas}</span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-hive-600 transition-all" style={{ width: `${entradaPercent}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                <span>Saidas</span>
                <span>{fluxo.saidas}</span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-honey-400 transition-all" style={{ width: `${saidaPercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="surface rounded-xl p-6">
          <h2 className="text-xl font-bold text-slate-950">Status das colmeias</h2>
          <div className="mt-5 grid gap-3">
            {[
              ["Ativas", resumo.colmeias_ativas, "bg-hive-50 text-hive-700"],
              ["Observacao", resumo.colmeias_em_observacao, "bg-amber-50 text-amber-700"],
              ["Risco", resumo.colmeias_em_risco, "bg-rose-50 text-rose-700"],
            ].map(([label, value, className]) => (
              <div key={label} className={`flex items-center justify-between rounded-lg px-4 py-3 ${className}`}>
                <span className="text-sm font-bold">{label}</span>
                <span className="text-lg font-black">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">Monitoramentos recentes</h2>
            <Link className="text-sm font-semibold text-hive-700 hover:text-hive-800" to="/monitoramentos/novo">
              Novo registro
            </Link>
          </div>
          <div className="space-y-4">
            {resumo.ultimos_monitoramentos.length ? (
              resumo.ultimos_monitoramentos.map((monitoramento) => (
                <MonitoringCard key={monitoramento.id} monitoramento={monitoramento} />
              ))
            ) : (
              <EmptyState
                icon={<LineChart className="h-6 w-6" />}
                title="Nenhum monitoramento registrado"
                description="Crie o primeiro registro para iniciar o historico."
              />
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-bold text-slate-950">Alertas recentes</h2>
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

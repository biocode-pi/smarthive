import { AlertTriangle, Camera, CheckCircle2, Flower2, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { obterResumoDashboard } from "../services/dashboard";
import type { DashboardResumo } from "../types";

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

  return (
    <>
      <PageHeader
        title="Visao geral"
        description="Painel operacional do SmartHive com dados do Supabase, registros de campo e captura visual pelo celular."
      >
        <Link
          to="/sensor-celular"
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-hive-600 bg-hive-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-hive-700"
        >
          <Camera className="h-4 w-4" />
          Abrir camera IA
        </Link>
      </PageHeader>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Colmeias" value={resumo.total_colmeias} icon={<Flower2 className="h-5 w-5" />} />
        <StatCard label="Ativas" value={resumo.colmeias_ativas} icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard label="Monitoramentos" value={resumo.monitoramentos_realizados} icon={<MapPin className="h-5 w-5" />} />
        <StatCard label="Alertas abertos" value={resumo.alertas_abertos} icon={<AlertTriangle className="h-5 w-5" />} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <div className="surface rounded-xl p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Operacao apicola</h2>
              <p className="mt-1 text-sm text-slate-500">Resumo rapido dos sinais de atividade nas colmeias.</p>
            </div>
            <Link
              to="/sensor-celular"
              className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              <Camera className="h-4 w-4" />
              Registrar pela camera
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-hive-50 p-4">
              <p className="text-sm font-semibold text-hive-700">Em observacao</p>
              <p className="mt-3 text-3xl font-bold text-hive-900">{resumo.colmeias_em_observacao}</p>
            </div>
            <div className="rounded-lg bg-rose-50 p-4">
              <p className="text-sm font-semibold text-rose-700">Em risco</p>
              <p className="mt-3 text-3xl font-bold text-rose-900">{resumo.colmeias_em_risco}</p>
            </div>
            <div className="rounded-lg bg-honey-100 p-4">
              <p className="text-sm font-semibold text-honey-500">Sensor celular</p>
              <p className="mt-3 text-lg font-bold text-slate-950">{resumo.sensor_celular.ativo ? "Ativo" : "Pausado"}</p>
            </div>
          </div>
        </div>

        <div className="surface rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-hive-600 p-3 text-white">
              <Camera className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-950">Camera com IA</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                A captura por celular classifica frames no navegador e registra evidencias no historico da colmeia.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

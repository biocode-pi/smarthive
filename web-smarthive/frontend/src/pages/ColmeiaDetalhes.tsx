import { ArrowLeft, Camera, LineChart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingState } from "../components/ui/LoadingState";
import { MonitoringCard } from "../components/ui/MonitoringCard";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { StatusBadge } from "../components/ui/StatusBadge";
import { listarMonitoramentosDaColmeia, obterColmeia } from "../services/colmeias";
import type { Colmeia, Monitoramento } from "../types";
import { formatDate, formatNumber } from "../utils/formatters";

export function ColmeiaDetalhes() {
  const { id } = useParams<{ id: string }>();
  const [colmeia, setColmeia] = useState<Colmeia | null>(null);
  const [monitoramentos, setMonitoramentos] = useState<Monitoramento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([obterColmeia(id), listarMonitoramentosDaColmeia(id)])
      .then(([colmeiaData, monitoramentosData]) => {
        setColmeia(colmeiaData);
        setMonitoramentos(monitoramentosData);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const indicadores = useMemo(() => {
    const totalFluxo = monitoramentos.reduce((acc, item) => acc + (item.fluxo_estimado ?? 0), 0);
    return {
      total: monitoramentos.length,
      fluxoMedio: monitoramentos.length ? Math.round(totalFluxo / monitoramentos.length) : 0,
      invasores: monitoramentos.filter((item) => item.possivel_invasor).length,
    };
  }, [monitoramentos]);

  if (loading) return <LoadingState />;

  if (!colmeia) {
    return <EmptyState title="Colmeia nao encontrada" description="O registro solicitado nao existe ou foi removido." />;
  }

  return (
    <>
      <PageHeader title={colmeia.nome} description="Detalhes operacionais, historico de monitoramentos e indicadores iniciais de atividade.">
        <Link
          to="/colmeias"
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <Link
          to={`/sensor-celular?colmeia_id=${encodeURIComponent(colmeia.id)}`}
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-hive-600 bg-hive-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-hive-700"
        >
          <Camera className="h-4 w-4" />
          Registrar pela camera
        </Link>
      </PageHeader>

      <section className="mb-6 rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-950">{colmeia.especie}</h2>
              <StatusBadge status={colmeia.status} />
            </div>
            <p className="mt-2 text-sm text-slate-600">{colmeia.localizacao || "Localizacao nao informada"}</p>
            <p className="mt-1 text-sm text-slate-500">Instalada em {formatDate(colmeia.instalada_em)}</p>
          </div>
          {colmeia.codigo ? <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">{colmeia.codigo}</p> : null}
        </div>
        {colmeia.descricao ? <p className="mt-4 text-sm leading-6 text-slate-600">{colmeia.descricao}</p> : null}
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Monitoramentos" value={indicadores.total} icon={<LineChart className="h-5 w-5" />} />
        <StatCard label="Fluxo medio" value={formatNumber(indicadores.fluxoMedio)} icon={<LineChart className="h-5 w-5" />} />
        <StatCard label="Registros com invasor" value={indicadores.invasores} icon={<LineChart className="h-5 w-5" />} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-950">Historico de monitoramentos</h2>
        <div className="space-y-4">
          {monitoramentos.length ? (
            monitoramentos.map((monitoramento) => <MonitoringCard key={monitoramento.id} monitoramento={monitoramento} />)
          ) : (
            <EmptyState
              title="Sem historico"
              description="Use a camera do celular para criar a linha do tempo da colmeia."
            />
          )}
        </div>
      </section>
    </>
  );
}


import { AlertTriangle, Check, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHeader } from "../components/ui/PageHeader";
import { listarAlertas, resolverAlerta } from "../services/alertas";
import type { Alerta } from "../types";
import { formatDateTime } from "../utils/formatters";

const severityClass: Record<Alerta["severidade"], string> = {
  baixa: "bg-hive-50 text-hive-700",
  media: "bg-amber-50 text-amber-700",
  alta: "bg-rose-50 text-rose-700",
};

export function Alertas() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      setAlertas(await listarAlertas());
    } catch {
      setError("Nao foi possivel carregar alertas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleResolve(id: string) {
    await resolverAlerta(id);
    await loadData();
  }

  if (loading) return <LoadingState />;

  const abertos = alertas.filter((alerta) => !alerta.resolvido);
  const resolvidos = alertas.filter((alerta) => alerta.resolvido);

  return (
    <>
      <PageHeader
        title="Alertas"
        description="Eventos criticos, baixa atividade e possiveis invasores observados."
      />

      {error ? (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="surface rounded-xl p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-rose-50 p-3 text-rose-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-950">Abertos</h2>
              <p className="text-sm text-slate-500">{abertos.length} alertas aguardando acao</p>
            </div>
          </div>

          {abertos.length === 0 ? (
            <EmptyState
              icon={<AlertTriangle className="h-6 w-6" />}
              title="Nenhum alerta aberto"
              description="A operacao nao possui alertas pendentes."
            />
          ) : (
            <div className="space-y-3">
              {abertos.map((alerta) => (
                <div key={alerta.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${severityClass[alerta.severidade]}`}>
                          {alerta.severidade}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          {alerta.tipo.replace("_", " ")}
                        </span>
                      </div>
                      <h3 className="mt-3 font-bold text-slate-950">{alerta.titulo}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{alerta.mensagem || "Sem mensagem adicional."}</p>
                      <p className="mt-2 text-xs font-semibold text-slate-400">{formatDateTime(alerta.criado_em)}</p>
                    </div>
                    <Button type="button" variant="secondary" icon={<Check className="h-4 w-4" />} onClick={() => handleResolve(alerta.id)}>
                      Resolver
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="surface rounded-xl p-6">
          <h2 className="text-xl font-bold text-slate-950">Resolvidos</h2>
          <div className="mt-5 space-y-3">
            {resolvidos.length ? (
              resolvidos.slice(0, 6).map((alerta) => (
                <div key={alerta.id} className="rounded-lg bg-slate-50 px-4 py-3">
                  <p className="text-sm font-bold text-slate-800">{alerta.titulo}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDateTime(alerta.resolvido_em ?? alerta.criado_em)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Nenhum alerta resolvido.</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

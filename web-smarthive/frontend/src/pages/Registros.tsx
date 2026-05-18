import { AlertTriangle, FileText, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHeader } from "../components/ui/PageHeader";
import { excluirMonitoramento, listarMonitoramentos } from "../services/monitoramentos";
import type { Monitoramento } from "../types";
import { formatDateTime } from "../utils/formatters";

export function Registros() {
  const [registros, setRegistros] = useState<Monitoramento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      setRegistros(await listarMonitoramentos());
    } catch {
      setError("Nao foi possivel carregar o historico.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Excluir este registro?")) return;
    await excluirMonitoramento(id);
    await loadData();
  }

  if (loading) return <LoadingState />;

  return (
    <>
      <PageHeader
        title="Historico"
        description="Capturas de camera e leituras experimentais."
      />

      {error ? (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="surface rounded-xl p-6">
        {registros.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="Nenhum registro encontrado"
            description="Os monitoramentos criados pela camera aparecem aqui."
          />
        ) : (
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Origem</th>
                  <th>Fluxo</th>
                  <th>Entradas/Saidas</th>
                  <th>Invasor</th>
                  <th className="text-right">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((registro) => (
                  <tr key={registro.id}>
                    <td>{formatDateTime(registro.data_hora ?? registro.criado_em)}</td>
                    <td>
                      <span className="rounded-full bg-hive-50 px-3 py-1 text-xs font-bold text-hive-700">
                        {registro.origem.replace("_", " ")}
                      </span>
                    </td>
                    <td>{registro.fluxo_estimado ?? registro.movimentos_estimados ?? "-"}</td>
                    <td>
                      {(registro.abelhas_entrando ?? 0)} / {(registro.abelhas_saindo ?? 0)}
                    </td>
                    <td>
                      {registro.possivel_invasor ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                          <AlertTriangle className="h-3 w-3" />
                          Sim
                        </span>
                      ) : (
                        <span className="text-slate-400">Nao</span>
                      )}
                    </td>
                    <td>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-9 w-9 px-0 text-rose-600"
                          onClick={() => handleDelete(registro.id)}
                          aria-label="Excluir registro"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

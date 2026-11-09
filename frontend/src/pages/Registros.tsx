import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { botao } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHeader } from "../components/ui/PageHeader";
import { listarColmeias } from "../services/colmeias";
import { excluirMonitoramento, listarMonitoramentos } from "../services/monitoramentos";
import type { Colmeia, Monitoramento } from "../types";
import { formatDateTime, formatNumber, origemLabel } from "../utils/formatters";

export function Registros() {
  const [registros, setRegistros] = useState<Monitoramento[]>([]);
  const [colmeias, setColmeias] = useState<Colmeia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setError(null);
    try {
      setRegistros(await listarMonitoramentos());
    } catch {
      setError("Não foi possível carregar o histórico. Confira a conexão e recarregue a página.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    listarColmeias()
      .then(setColmeias)
      .catch(() => setColmeias([]));
  }, []);

  async function handleDelete(registro: Monitoramento) {
    if (!confirm(`Excluir a captura de ${formatDateTime(registro.data_hora ?? registro.criado_em)}?`)) return;
    await excluirMonitoramento(registro.id);
    await loadData();
  }

  if (loading) return <LoadingState />;

  const colmeiaPorId = new Map(colmeias.map((c) => [c.id, c]));
  const comInvasor = registros.filter((r) => r.possivel_invasor).length;

  return (
    <>
      <PageHeader
        title="Histórico"
        leitura={`${formatNumber(registros.length)} ${registros.length === 1 ? "captura" : "capturas"} · ${formatNumber(comInvasor)} com possível invasor`}
      />

      {error ? <p className="mb-6 font-bold text-status-risco-texto">{error}</p> : null}

      {registros.length === 0 && !error ? (
        <EmptyState
          title="Nenhuma captura registrada"
          description="Cada captura feita pelo celular entra aqui, com o movimento estimado na entrada da colmeia."
          acao={
            <Link to="/app/sensor-celular" className={botao("primary")}>
              Fazer captura
            </Link>
          }
        />
      ) : (
        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Colmeia</th>
                <th>Origem</th>
                <th className="text-right">Movimento</th>
                <th className="text-right">Entrou / saiu</th>
                <th>Invasor</th>
                <th>
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {registros.map((registro) => {
                const colmeia = colmeiaPorId.get(registro.colmeia_id);
                return (
                  <tr key={registro.id} className="hover:bg-ink/[0.03]">
                    <td className="whitespace-nowrap font-dados text-ink/75">{formatDateTime(registro.data_hora ?? registro.criado_em)}</td>
                    <td>
                      {colmeia ? (
                        <Link to={`/app/colmeias/${colmeia.id}`} className="focus-ring rounded font-bold hover:underline hover:decoration-2 hover:underline-offset-4">
                          {colmeia.nome}
                          {colmeia.codigo ? <span className="ml-2 font-dados text-xs font-normal text-ink/60">{colmeia.codigo}</span> : null}
                        </Link>
                      ) : (
                        <span className="text-ink/50">—</span>
                      )}
                    </td>
                    <td className="text-ink/75">{origemLabel(registro.origem)}</td>
                    <td className="tabular text-right font-dados font-medium">
                      {formatNumber(registro.fluxo_estimado ?? registro.movimentos_estimados)}
                    </td>
                    <td className="tabular whitespace-nowrap text-right font-dados text-ink/75">
                      {formatNumber(registro.abelhas_entrando)} / {formatNumber(registro.abelhas_saindo)}
                    </td>
                    <td>
                      {registro.possivel_invasor ? (
                        <span className="font-bold text-status-risco-texto">Sim</span>
                      ) : (
                        <span className="text-ink/45">Não</span>
                      )}
                    </td>
                    <td className="w-12 pr-0 text-right">
                      <button
                        type="button"
                        className="press focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full text-ink/45 hover:bg-status-risco/50 hover:text-status-risco-texto"
                        onClick={() => handleDelete(registro)}
                        aria-label="Excluir captura"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

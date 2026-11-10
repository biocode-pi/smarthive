import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { AlertaLinha } from "../components/ui/AlertaLinha";
import { Button } from "../components/ui/Button";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHeader } from "../components/ui/PageHeader";
import { Secao } from "../components/ui/Secao";
import { listarAlertas, resolverAlerta } from "../services/alertas";
import { listarColmeias } from "../services/colmeias";
import type { Alerta, Colmeia } from "../types";
import { formatDateTime, formatNumber } from "../utils/formatters";

const ordemSeveridade: Record<Alerta["severidade"], number> = { alta: 0, media: 1, baixa: 2 };

export function Alertas() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [colmeias, setColmeias] = useState<Colmeia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvendo, setResolvendo] = useState<string | null>(null);

  async function loadData() {
    setError(null);
    try {
      setAlertas(await listarAlertas());
    } catch {
      setError("Não foi possível carregar os alertas. Confira a conexão e recarregue a página.");
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

  async function handleResolve(id: string) {
    setResolvendo(id);
    try {
      await resolverAlerta(id);
      await loadData();
    } finally {
      setResolvendo(null);
    }
  }

  if (loading) return <LoadingState />;

  const codigoDaColmeia = new Map(colmeias.map((c) => [c.id, c.codigo || c.nome]));
  const abertos = alertas
    .filter((alerta) => !alerta.resolvido)
    .sort((a, b) => ordemSeveridade[a.severidade] - ordemSeveridade[b.severidade] || b.criado_em.localeCompare(a.criado_em));
  const resolvidos = alertas.filter((alerta) => alerta.resolvido);

  return (
    <>
      <PageHeader
        title="Alertas"
        leitura={`${formatNumber(abertos.length)} ${abertos.length === 1 ? "aberto" : "abertos"} · ${formatNumber(resolvidos.length)} ${resolvidos.length === 1 ? "resolvido" : "resolvidos"}`}
      />

      {error ? <p className="mb-6 font-bold text-status-risco-texto">{error}</p> : null}

      <div className="grid gap-x-12 lg:grid-cols-[1.5fr_1fr]">
        <section className="min-w-0">
          <h2 className="titulo-secao mb-4">Abertos</h2>
          {abertos.length ? (
            <ul className="border-t border-ink/15">
              {abertos.map((alerta) => (
                <AlertaLinha
                  key={alerta.id}
                  alerta={alerta}
                  colmeia={alerta.colmeia_id ? codigoDaColmeia.get(alerta.colmeia_id) : undefined}
                  acao={
                    <Button variant="secondary" onClick={() => handleResolve(alerta.id)} disabled={resolvendo === alerta.id}>
                      <Check className="h-4 w-4" aria-hidden="true" />
                      {resolvendo === alerta.id ? "Resolvendo…" : "Resolver"}
                    </Button>
                  }
                />
              ))}
            </ul>
          ) : (
            <p className="border-t border-ink/15 pt-4 text-ink/75">
              Nenhum alerta aberto. Quando uma captura mostrar queda de atividade ou um possível invasor, o aviso aparece aqui.
            </p>
          )}
        </section>

        <Secao titulo="Resolvidos" className="lg:mt-0">
          {resolvidos.length ? (
            <ul className="border-t border-ink/15">
              {resolvidos.slice(0, 10).map((alerta) => (
                <li key={alerta.id} className="border-b border-ink/10 py-3">
                  <p className="text-sm font-bold text-ink/80">{alerta.titulo}</p>
                  <p className="mt-0.5 font-dados text-xs text-ink/55">
                    resolvido em {formatDateTime(alerta.resolvido_em ?? alerta.criado_em)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="border-t border-ink/15 pt-4 text-ink/60">Nenhum alerta resolvido ainda.</p>
          )}
        </Secao>
      </div>
    </>
  );
}

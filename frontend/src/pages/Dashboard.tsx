import { Camera } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertaLinha } from "../components/ui/AlertaLinha";
import { botao } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { BalancoFluxo, GraficoFluxo, serieDeFluxo } from "../components/ui/Fluxo";
import { Leituras } from "../components/ui/Leituras";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHeader } from "../components/ui/PageHeader";
import { RegistroLinha } from "../components/ui/RegistroLinha";
import { Secao } from "../components/ui/Secao";
import { Hexa } from "../components/ui/StatusBadge";
import { listarColmeias } from "../services/colmeias";
import { obterResumoDashboard } from "../services/dashboard";
import type { Colmeia, DashboardResumo, StatusColmeia } from "../types";
import { formatNumber } from "../utils/formatters";

/** Atividade: o que as capturas recentes mediram na entrada das colmeias. */
export function Dashboard() {
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [colmeias, setColmeias] = useState<Colmeia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([obterResumoDashboard(), listarColmeias().catch(() => [])])
      .then(([dados, lista]) => {
        setResumo(dados);
        setColmeias(lista);
      })
      .catch(() => setError(true))
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
        title="Não foi possível carregar a atividade"
        description="A plataforma não respondeu. Confira a conexão e recarregue a página."
      />
    );
  }

  const registros = resumo.ultimos_monitoramentos;
  const codigoDaColmeia = new Map(colmeias.map((c) => [c.id, c.codigo || c.nome]));
  const situacoes: Array<[StatusColmeia, string, number]> = [
    ["ativa", "Em dia", resumo.colmeias_ativas],
    ["observacao", "Em observação", resumo.colmeias_em_observacao],
    ["risco", "Em risco", resumo.colmeias_em_risco],
  ];

  return (
    <>
      <PageHeader
        title="Atividade"
        leitura={`${formatNumber(registros.length)} capturas recentes · ${formatNumber(resumo.monitoramentos_realizados)} no total`}
      >
        <Link to="/app/sensor-celular" className={botao("primary")}>
          <Camera className="h-4 w-4" aria-hidden="true" />
          Nova captura
        </Link>
      </PageHeader>

      <Leituras
        itens={[
          { rotulo: "Entradas", valor: formatNumber(fluxo.entradas) },
          { rotulo: "Saídas", valor: formatNumber(fluxo.saidas) },
          { rotulo: "Movimentos", valor: formatNumber(fluxo.movimentos) },
          { rotulo: "Possível invasor", valor: formatNumber(fluxo.invasores), alerta: fluxo.invasores > 0 },
        ]}
      />

      <Secao titulo="Movimento por captura">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <GraficoFluxo data={serieDeFluxo(registros, 10)} />
          <div className="space-y-8">
            <BalancoFluxo entradas={fluxo.entradas} saidas={fluxo.saidas} />
            <div>
              <p className="rotulo">Situação das colmeias</p>
              <ul className="mt-2 border-t border-ink/15">
                {situacoes.map(([status, rotulo, valor]) => (
                  <li key={status} className="flex items-center gap-3 border-b border-ink/10 py-2.5">
                    <Hexa status={status} className="h-4 w-4" />
                    <span className="flex-1 font-bold text-ink">{rotulo}</span>
                    <span className="tabular font-dados text-lg font-medium text-ink">{formatNumber(valor)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Secao>

      <div className="grid gap-x-12 lg:grid-cols-[1.35fr_1fr]">
        <Secao
          titulo="Capturas recentes"
          acao={
            <Link className="link-acao focus-ring text-sm" to="/app/registros">
              Ver histórico
            </Link>
          }
        >
          {registros.length ? (
            <ul className="border-t border-ink/15">
              {registros.map((m) => (
                <RegistroLinha key={m.id} monitoramento={m} colmeia={codigoDaColmeia.get(m.colmeia_id)} />
              ))}
            </ul>
          ) : (
            <EmptyState title="Nenhuma captura ainda" description="As capturas feitas pelo celular aparecem aqui." />
          )}
        </Secao>

        <Secao
          titulo="Alertas recentes"
          acao={
            <Link className="link-acao focus-ring text-sm" to="/app/alertas">
              Ver alertas
            </Link>
          }
        >
          {resumo.alertas_recentes.length ? (
            <ul className="border-t border-ink/15">
              {resumo.alertas_recentes.map((a) => (
                <AlertaLinha key={a.id} alerta={a} colmeia={a.colmeia_id ? codigoDaColmeia.get(a.colmeia_id) : undefined} />
              ))}
            </ul>
          ) : (
            <p className="border-t border-ink/15 pt-4 text-ink/75">Nenhum alerta recente.</p>
          )}
        </Secao>
      </div>
    </>
  );
}

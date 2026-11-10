import { Camera } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { botao } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { GraficoFluxo, serieDeFluxo } from "../components/ui/Fluxo";
import { Leituras } from "../components/ui/Leituras";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHeader } from "../components/ui/PageHeader";
import { RegistroLinha } from "../components/ui/RegistroLinha";
import { Secao } from "../components/ui/Secao";
import { StatusBadge } from "../components/ui/StatusBadge";
import { obterMeliponario } from "../services/meliponarios";
import { listarMonitoramentosDaColmeia, obterColmeia } from "../services/colmeias";
import type { Colmeia, Meliponario, Monitoramento } from "../types";
import { formatDate, formatNumber } from "../utils/formatters";

export function ColmeiaDetalhes() {
  const { id } = useParams<{ id: string }>();
  const [colmeia, setColmeia] = useState<Colmeia | null>(null);
  const [meliponario, setMeliponario] = useState<Meliponario | null>(null);
  const [monitoramentos, setMonitoramentos] = useState<Monitoramento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([obterColmeia(id), listarMonitoramentosDaColmeia(id)])
      .then(([colmeiaData, monitoramentosData]) => {
        setColmeia(colmeiaData);
        setMonitoramentos(monitoramentosData);
        if (colmeiaData.meliponario_id) {
          obterMeliponario(colmeiaData.meliponario_id)
            .then(setMeliponario)
            .catch(() => setMeliponario(null));
        }
      })
      .catch(() => setColmeia(null))
      .finally(() => setLoading(false));
  }, [id]);

  const indicadores = useMemo(() => {
    const totalFluxo = monitoramentos.reduce((acc, item) => acc + (item.fluxo_estimado ?? 0), 0);
    return {
      total: monitoramentos.length,
      fluxoMedio: monitoramentos.length ? Math.round(totalFluxo / monitoramentos.length) : 0,
      ultimo: monitoramentos[0]?.fluxo_estimado ?? null,
      invasores: monitoramentos.filter((item) => item.possivel_invasor).length,
    };
  }, [monitoramentos]);

  if (loading) return <LoadingState />;

  if (!colmeia) {
    return (
      <EmptyState
        title="Colmeia não encontrada"
        description="Ela pode ter sido excluída. Volte para a lista e escolha outra."
        acao={
          <Link to="/app/colmeias" className={botao("secondary")}>
            Ver colmeias
          </Link>
        }
      />
    );
  }

  // Ficha da caixa: so o que foi preenchido.
  const ficha: Array<[string, string]> = [
    ["Código", colmeia.codigo || "—"],
    ["Espécie", colmeia.especie],
    ["Meliponário", meliponario?.nome ?? (colmeia.meliponario_id ? "…" : "Sem meliponário")],
    ["Onde fica", colmeia.localizacao || "Não informado"],
    ["Instalada em", formatDate(colmeia.instalada_em)],
  ];

  return (
    <>
      <PageHeader
        voltar={meliponario ? { to: `/app/meliponarios/${meliponario.id}`, label: meliponario.nome } : { to: "/app/colmeias", label: "Colmeias" }}
        title={colmeia.nome}
        leitura={<StatusBadge status={colmeia.status} />}
      >
        <Link to={`/app/sensor-celular?colmeia=${colmeia.id}`} className={botao("primary")}>
          <Camera className="h-4 w-4" aria-hidden="true" />
          Nova captura
        </Link>
      </PageHeader>

      <section className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-12">
        <div>
          <dl className="border-t border-ink/15">
            {ficha.map(([termo, valor]) => (
              <div key={termo} className="flex items-baseline justify-between gap-6 border-b border-ink/10 py-3">
                <dt className="rotulo">{termo}</dt>
                <dd className={termo === "Código" ? "font-dados text-ink" : "text-right font-bold text-ink"}>{valor}</dd>
              </div>
            ))}
          </dl>
          {colmeia.descricao ? <p className="mt-5 whitespace-pre-line leading-relaxed text-ink/75">{colmeia.descricao}</p> : null}
        </div>

        <div className="min-w-0">
          <Leituras
            itens={[
              { rotulo: "Capturas", valor: formatNumber(indicadores.total) },
              { rotulo: "Fluxo médio", valor: formatNumber(indicadores.fluxoMedio), nota: indicadores.ultimo !== null ? `última: ${formatNumber(indicadores.ultimo)}` : undefined },
              { rotulo: "Com invasor", valor: formatNumber(indicadores.invasores), alerta: indicadores.invasores > 0 },
            ]}
          />
          <div className="mt-6">
            <GraficoFluxo data={serieDeFluxo(monitoramentos, 12)} />
          </div>
        </div>
      </section>

      <Secao titulo="Histórico de capturas">
        {monitoramentos.length ? (
          <ul className="border-t border-ink/15">
            {monitoramentos.map((monitoramento) => (
              <RegistroLinha key={monitoramento.id} monitoramento={monitoramento} />
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Nenhuma captura desta colmeia"
            description="Aponte o celular para a entrada da caixa e salve a primeira captura. O histórico começa por ela."
            acao={
              <Link to={`/app/sensor-celular?colmeia=${colmeia.id}`} className={botao("primary")}>
                <Camera className="h-4 w-4" aria-hidden="true" />
                Fazer captura
              </Link>
            }
          />
        )}
      </Secao>
    </>
  );
}

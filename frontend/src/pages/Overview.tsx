import { Camera } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertaLinha } from "../components/ui/AlertaLinha";
import { botao } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { FavoMap, LegendaFavo, type CelulaFavo } from "../components/ui/FavoMap";
import { BalancoFluxo, GraficoFluxo, serieDeFluxo } from "../components/ui/Fluxo";
import { Leituras } from "../components/ui/Leituras";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHeader } from "../components/ui/PageHeader";
import { Secao } from "../components/ui/Secao";
import { Hexa, StatusBadge } from "../components/ui/StatusBadge";
import { listarColmeias } from "../services/colmeias";
import { obterResumoDashboard } from "../services/dashboard";
import type { Colmeia, DashboardResumo } from "../types";
import { formatDateTime, formatNumber, formatSigned, origemLabel } from "../utils/formatters";

// Mais grave primeiro: no centro do favo e no topo da lista de atencao.
const gravidade: Record<string, number> = { risco: 0, observacao: 1, ativa: 2, inativa: 3 };

export function Overview() {
  const navigate = useNavigate();
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [colmeias, setColmeias] = useState<Colmeia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([obterResumoDashboard(), listarColmeias()])
      .then(([dados, lista]) => {
        setResumo(dados);
        setColmeias(lista);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const indicadores = useMemo(() => {
    const registros = resumo?.ultimos_monitoramentos ?? [];
    const totais = registros.reduce(
      (acc, item) => {
        acc.entradas += item.abelhas_entrando ?? 0;
        acc.saidas += item.abelhas_saindo ?? 0;
        acc.fluxo += item.fluxo_estimado ?? (item.abelhas_entrando ?? 0) + (item.abelhas_saindo ?? 0);
        acc.invasores += item.possivel_invasor ? 1 : 0;
        return acc;
      },
      { entradas: 0, saidas: 0, fluxo: 0, invasores: 0 },
    );
    const mediaFluxo = registros.length ? Math.round(totais.fluxo / registros.length) : 0;
    return { ...totais, mediaFluxo, registros };
  }, [resumo]);

  if (loading) return <LoadingState />;

  if (error || !resumo) {
    return (
      <EmptyState
        title="Não foi possível carregar a visão geral"
        description="A plataforma não respondeu. Confira a conexão e recarregue a página."
      />
    );
  }

  const ordenadas = [...colmeias].sort((a, b) => gravidade[a.status] - gravidade[b.status]);
  const codigoDaColmeia = new Map(colmeias.map((c) => [c.id, c.codigo || c.nome]));
  // Ultimo fluxo conhecido de cada colmeia (os monitoramentos vem do mais recente ao mais antigo).
  const ultimoFluxo = new Map<string, number>();
  for (const item of indicadores.registros) {
    if (!ultimoFluxo.has(item.colmeia_id)) ultimoFluxo.set(item.colmeia_id, item.fluxo_estimado ?? 0);
  }
  const celulas: CelulaFavo[] = ordenadas.map((c) => ({
    id: c.id,
    codigo: c.codigo || c.nome.slice(0, 7),
    nome: c.nome,
    status: c.status,
    detalhe: ultimoFluxo.has(c.id) ? `${ultimoFluxo.get(c.id)} mov.` : undefined,
  }));
  const atencao = ordenadas.filter((c) => c.status === "risco" || c.status === "observacao");
  const alertasAbertos = resumo.alertas_recentes.filter((a) => !a.resolvido);
  const ultima = indicadores.registros[0];

  return (
    <>
      <PageHeader
        title="Visão geral"
        leitura={
          <>
            {formatNumber(resumo.total_colmeias)} colmeias · {formatNumber(resumo.colmeias_em_risco)} em risco ·{" "}
            {ultima ? `última captura ${formatDateTime(ultima.data_hora ?? ultima.criado_em)}` : "nenhuma captura ainda"}
          </>
        }
      >
        <Link to="/app/registros" className={botao("secondary")}>
          Histórico
        </Link>
        <Link to="/app/sensor-celular" className={botao("primary")}>
          <Camera className="h-4 w-4" aria-hidden="true" />
          Nova captura
        </Link>
      </PageHeader>

      <section className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        <figure className="surface p-5 sm:p-7">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="titulo-secao">Mapa das colmeias</p>
            <p className="rotulo">a mais grave no centro</p>
          </div>
          {celulas.length ? (
            <>
              <FavoMap celulas={celulas} onSelecionar={(id) => navigate(`/app/colmeias/${id}`)} className="mx-auto mt-5 max-w-sm" />
              <div className="mt-5 border-t border-ink/10 pt-4">
                <LegendaFavo celulas={celulas} />
              </div>
            </>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="Nenhuma colmeia ainda"
                description="Cada colmeia cadastrada vira um hexágono deste mapa."
                acao={
                  <Link to="/app/colmeias?nova=1" className={botao("primary")}>
                    Cadastrar colmeia
                  </Link>
                }
              />
            </div>
          )}
        </figure>

        <div className="min-w-0">
          <h2 className="titulo-secao">Precisa de atenção</h2>
          {alertasAbertos.length || atencao.length ? (
            <>
              {alertasAbertos.length ? (
                <ul className="mt-3 border-t border-ink/15">
                  {alertasAbertos.slice(0, 3).map((alerta) => (
                    <AlertaLinha
                      key={alerta.id}
                      alerta={alerta}
                      colmeia={alerta.colmeia_id ? codigoDaColmeia.get(alerta.colmeia_id) : undefined}
                    />
                  ))}
                </ul>
              ) : null}
              {atencao.length ? (
                <ul className={alertasAbertos.length ? "mt-6" : "mt-3 border-t border-ink/15"}>
                  {atencao.slice(0, 5).map((c) => (
                    <li key={c.id}>
                      <Link
                        to={`/app/colmeias/${c.id}`}
                        className="press focus-ring flex items-center gap-3 rounded border-b border-ink/10 py-3 hover:bg-ink/[0.03]"
                      >
                        <Hexa status={c.status} className="h-4 w-4" />
                        <span className="w-20 flex-shrink-0 font-dados text-sm text-ink">{c.codigo || "—"}</span>
                        <span className="min-w-0 flex-1 truncate font-bold text-ink">{c.nome}</span>
                        <StatusBadge status={c.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
              <Link to="/app/alertas" className="link-acao focus-ring mt-4 inline-block text-sm">
                Ver todos os alertas
              </Link>
            </>
          ) : (
            <p className="mt-3 border-t border-ink/15 pt-4 text-ink/75">
              Nenhuma colmeia em risco e nenhum alerta aberto. Bom momento para uma captura de rotina.
            </p>
          )}
        </div>
      </section>

      <Leituras
        className="mt-12"
        itens={[
          { rotulo: "Colmeias", valor: formatNumber(resumo.total_colmeias), nota: `${formatNumber(resumo.colmeias_ativas)} em dia` },
          { rotulo: "Capturas", valor: formatNumber(resumo.monitoramentos_realizados), nota: "desde o cadastro" },
          {
            rotulo: "Fluxo médio",
            valor: formatNumber(indicadores.mediaFluxo),
            nota: `saldo ${formatSigned(indicadores.entradas - indicadores.saidas)} nas últimas`,
          },
          {
            rotulo: "Alertas abertos",
            valor: formatNumber(resumo.alertas_abertos),
            nota: resumo.alertas_abertos ? "aguardando revisão" : "nenhum pendente",
            alerta: resumo.alertas_abertos > 0,
          },
        ]}
      />

      <Secao
        titulo="Movimento na entrada"
        acao={indicadores.registros.length ? <span className="rotulo">últimas {Math.min(indicadores.registros.length, 8)} capturas</span> : null}
      >
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-end">
          <GraficoFluxo data={serieDeFluxo(indicadores.registros)} />
          <BalancoFluxo entradas={indicadores.entradas} saidas={indicadores.saidas} invasores={indicadores.invasores} />
        </div>
      </Secao>

      <Secao
        titulo="Últimas capturas"
        acao={
          <Link className="link-acao focus-ring text-sm" to="/app/registros">
            Ver histórico
          </Link>
        }
      >
        {indicadores.registros.length ? (
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Quando</th>
                  <th>Colmeia</th>
                  <th className="text-right">Movimento</th>
                  <th>Origem</th>
                </tr>
              </thead>
              <tbody>
                {indicadores.registros.slice(0, 5).map((item) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap font-dados text-ink/75">{formatDateTime(item.data_hora ?? item.criado_em)}</td>
                    <td className="whitespace-nowrap font-dados">{codigoDaColmeia.get(item.colmeia_id) ?? "—"}</td>
                    <td className="tabular text-right font-dados font-medium">{formatNumber(item.fluxo_estimado)}</td>
                    <td className="text-ink/75">{origemLabel(item.origem)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Nenhuma captura ainda"
            description="Aponte o celular para a entrada de uma colmeia e salve a primeira captura."
            acao={
              <Link to="/app/sensor-celular" className={botao("primary")}>
                Fazer captura
              </Link>
            }
          />
        )}
      </Secao>
    </>
  );
}

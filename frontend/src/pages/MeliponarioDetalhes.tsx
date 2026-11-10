import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { botao, Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { FavoMap, LegendaFavo, type CelulaFavo } from "../components/ui/FavoMap";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHeader } from "../components/ui/PageHeader";
import { StatusBadge } from "../components/ui/StatusBadge";
import { excluirMeliponario, listarColmeiasDoMeliponario, obterMeliponario } from "../services/meliponarios";
import type { Colmeia, Meliponario } from "../types";
import { enderecoCompleto, SeloAlertas } from "./Meliponarios";

const gravidade: Record<string, number> = { risco: 0, observacao: 1, ativa: 2, inativa: 3 };

export function MeliponarioDetalhes() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [meliponario, setMeliponario] = useState<Meliponario | null>(null);
  const [colmeias, setColmeias] = useState<Colmeia[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([obterMeliponario(id), listarColmeiasDoMeliponario(id)])
      .then(([m, c]) => {
        setMeliponario(m);
        setColmeias(c);
      })
      .catch(() => setErro("Meliponário não encontrado"));
  }, [id]);

  async function excluir() {
    if (!meliponario) return;
    if (!confirm(`Excluir "${meliponario.nome}"? As colmeias continuam cadastradas, apenas sem meliponário.`)) return;
    await excluirMeliponario(meliponario.id);
    navigate("/app/meliponarios", { replace: true });
  }

  if (erro) {
    return (
      <EmptyState
        title={erro}
        description="Ele pode ter sido excluído. Volte para a lista e escolha outro."
        acao={
          <Link to="/app/meliponarios" className={botao("secondary")}>
            Ver meliponários
          </Link>
        }
      />
    );
  }
  if (!meliponario) return <LoadingState />;

  const ordenadas = [...colmeias].sort((a, b) => gravidade[a.status] - gravidade[b.status]);
  const celulas: CelulaFavo[] = ordenadas.map((c) => ({
    id: c.id,
    codigo: c.codigo || c.nome.slice(0, 7),
    nome: c.nome,
    status: c.status,
  }));
  const endereco = enderecoCompleto(meliponario);

  return (
    <>
      <PageHeader
        voltar={{ to: "/app/meliponarios", label: "Meliponários" }}
        title={meliponario.nome}
        leitura={[endereco && `${endereco}${meliponario.uf ? ` · ${meliponario.uf}` : ""}`, `${colmeias.length} ${colmeias.length === 1 ? "colmeia" : "colmeias"}`]
          .filter(Boolean)
          .join(" · ")}
      >
        <Link to={`/app/colmeias?meliponario=${meliponario.id}`} className={botao("primary")}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Adicionar colmeia
        </Link>
        <Button variant="ghost" onClick={excluir} className="text-status-risco-texto hover:text-status-risco-texto">
          <Trash2 className="h-4 w-4" aria-hidden="true" /> Excluir
        </Button>
      </PageHeader>

      <div className="mb-8">
        <SeloAlertas alertas={meliponario.alertas_abertos} />
        {meliponario.descricao ? <p className="mt-3 max-w-2xl leading-relaxed text-ink/75">{meliponario.descricao}</p> : null}
      </div>

      {colmeias.length ? (
        <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          <figure className="surface p-5 sm:p-7">
            <FavoMap celulas={celulas} onSelecionar={(cid) => navigate(`/app/colmeias/${cid}`)} className="mx-auto max-w-xs" />
            <div className="mt-5 border-t border-ink/10 pt-4">
              <LegendaFavo celulas={celulas} />
            </div>
          </figure>

          <div className="min-w-0">
            <h2 className="titulo-secao">Colmeias</h2>
            <ul className="mt-3 border-t border-ink/15">
              {ordenadas.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/app/colmeias/${c.id}`}
                    className="press focus-ring flex items-center justify-between gap-4 rounded border-b border-ink/10 py-3 hover:bg-ink/[0.03]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-ink">{c.nome}</span>
                      <span className="font-dados text-xs text-ink/65">
                        {c.codigo ? `${c.codigo} · ` : ""}
                        {c.especie}
                      </span>
                    </span>
                    <StatusBadge status={c.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <EmptyState
          title="Nenhuma colmeia neste meliponário"
          description="Adicione as caixas que ficam aqui para acompanhar cada uma no mapa."
          acao={
            <Link to={`/app/colmeias?meliponario=${meliponario.id}`} className={botao("primary")}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Adicionar colmeia
            </Link>
          }
        />
      )}
    </>
  );
}

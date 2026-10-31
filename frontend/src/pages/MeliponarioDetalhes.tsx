import { ArrowLeft, MapPin, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "../components/ui/EmptyState";
import { FavoMap, LegendaFavo, type CelulaFavo } from "../components/ui/FavoMap";
import { LoadingState } from "../components/ui/LoadingState";
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
      .catch(() => setErro("Meliponário não encontrado."));
  }, [id]);

  async function excluir() {
    if (!meliponario) return;
    if (!confirm(`Excluir "${meliponario.nome}"? As colmeias continuam cadastradas, apenas sem meliponário.`)) return;
    await excluirMeliponario(meliponario.id);
    navigate("/app/meliponarios", { replace: true });
  }

  if (erro) return <EmptyState title={erro} description="Volte para a lista e escolha outro meliponário." />;
  if (!meliponario) return <LoadingState />;

  const celulas: CelulaFavo[] = [...colmeias]
    .sort((a, b) => gravidade[a.status] - gravidade[b.status])
    .map((c) => ({ id: c.id, codigo: c.codigo || c.nome.slice(0, 7), nome: c.nome, status: c.status }));

  return (
    <>
      <Link to="/app/meliponarios" className="focus-ring inline-flex items-center gap-1 rounded text-sm font-bold text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Meliponários
      </Link>

      <section className="mt-3 rounded-card bg-white p-5 shadow-app">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-ink">{meliponario.nome}</h1>
            {enderecoCompleto(meliponario) ? (
              <p className="mt-1 flex items-center gap-1 text-sm font-bold text-[#5c5c5c]">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {enderecoCompleto(meliponario)}
              </p>
            ) : null}
            <div className="mt-3">
              <SeloAlertas alertas={meliponario.alertas_abertos} />
            </div>
          </div>
          <button
            type="button"
            onClick={excluir}
            className="focus-ring inline-flex h-10 items-center gap-2 rounded-field bg-white px-3 text-sm font-bold text-status-risco-texto ring-1 ring-status-risco hover:bg-status-risco"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" /> Excluir
          </button>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="surface p-5">
          <h2 className="text-lg font-bold text-ink">Colmeias ({colmeias.length})</h2>
          {celulas.length ? (
            <>
              <FavoMap celulas={celulas} onSelecionar={(cid) => navigate(`/app/colmeias/${cid}`)} className="mx-auto mt-4 max-w-xs" />
              <div className="mt-4 border-t border-border pt-4">
                <LegendaFavo celulas={celulas} />
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-700">Nenhuma colmeia neste meliponário ainda.</p>
          )}
        </div>

        <div className="surface p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-ink">Lista</h2>
            <Link
              to={`/app/colmeias?meliponario=${meliponario.id}`}
              className="focus-ring inline-flex h-10 items-center gap-2 rounded-field bg-hive-600 px-3 text-sm font-bold text-ink shadow-app hover:brightness-95"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Adicionar colmeia
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {colmeias.map((c) => (
              <li key={c.id}>
                <Link to={`/app/colmeias/${c.id}`} className="focus-ring flex items-center justify-between gap-3 rounded py-3">
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-ink">{c.nome}</span>
                    <span className="text-sm text-slate-700">
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
    </>
  );
}

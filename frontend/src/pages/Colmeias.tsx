import axios from "axios";
import { Plus, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { botao, Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHeader } from "../components/ui/PageHeader";
import { Sheet } from "../components/ui/Sheet";
import { StatusBadge } from "../components/ui/StatusBadge";
import { criarColmeia, excluirColmeia, listarColmeias } from "../services/colmeias";
import { listarMeliponarios } from "../services/meliponarios";
import type { Colmeia, Meliponario, StatusColmeia } from "../types";
import { formatNumber } from "../utils/formatters";

const initialForm = {
  nome: "",
  codigo: "",
  especie: "Jataí",
  localizacao: "",
  descricao: "",
  status: "ativa" as StatusColmeia,
  instalada_em: "",
  meliponario_id: "",
};

const especiesComuns = ["Jataí", "Mandaçaia", "Uruçu", "Mirim", "Iraí", "Tubuna", "Manduri", "Borá"];

export function Colmeias() {
  const [searchParams] = useSearchParams();
  const meliponarioInicial = searchParams.get("meliponario") ?? "";
  const [colmeias, setColmeias] = useState<Colmeia[]>([]);
  // Vindo de "Adicionar colmeia" num meliponario, o painel ja abre com ele selecionado.
  const [form, setForm] = useState({ ...initialForm, meliponario_id: meliponarioInicial });
  const [formAberto, setFormAberto] = useState(Boolean(meliponarioInicial) || searchParams.has("nova"));
  const [meliponarios, setMeliponarios] = useState<Meliponario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [erroForm, setErroForm] = useState<string | null>(null);

  async function loadData() {
    setError(null);
    try {
      setColmeias(await listarColmeias());
    } catch {
      setError("Não foi possível carregar as colmeias. Confira a conexão e recarregue a página.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    listarMeliponarios()
      .then(setMeliponarios)
      .catch(() => setMeliponarios([]));
  }, []);

  function updateField(key: keyof typeof form, value: string) {
    setForm((state) => ({ ...state, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setErroForm(null);

    try {
      await criarColmeia({
        nome: form.nome,
        codigo: form.codigo || null,
        especie: form.especie,
        localizacao: form.localizacao || null,
        descricao: form.descricao || null,
        status: form.status,
        instalada_em: form.instalada_em || null,
        meliponario_id: form.meliponario_id || null,
      });
      setForm({ ...initialForm, meliponario_id: form.meliponario_id });
      setFormAberto(false);
      await loadData();
    } catch (erro) {
      // 409: codigo ja usado em outra colmeia; a API informa o motivo.
      const repetido = axios.isAxiosError(erro) && erro.response?.status === 409;
      setErroForm(repetido ? erro.response?.data.detail : "Não foi possível salvar a colmeia. Confira os campos e tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(colmeia: Colmeia) {
    if (!confirm(`Excluir a colmeia "${colmeia.nome}"? O histórico de capturas dela também será apagado.`)) return;
    await excluirColmeia(colmeia.id);
    await loadData();
  }

  if (loading) return <LoadingState />;

  const nomeMeliponario = new Map(meliponarios.map((m) => [m.id, m.nome]));
  const emRisco = colmeias.filter((c) => c.status === "risco").length;

  return (
    <>
      <PageHeader
        title="Colmeias"
        leitura={`${formatNumber(colmeias.length)} ${colmeias.length === 1 ? "colmeia" : "colmeias"} · ${formatNumber(emRisco)} em risco`}
      >
        <Button onClick={() => setFormAberto(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Nova colmeia
        </Button>
      </PageHeader>

      {error ? <p className="mb-6 font-bold text-status-risco-texto">{error}</p> : null}

      {colmeias.length === 0 && !error ? (
        <EmptyState
          title="Nenhuma colmeia cadastrada"
          description="Cadastre a primeira caixa com nome, espécie e meliponário. Depois disso ela já pode receber capturas."
          acao={
            <Button onClick={() => setFormAberto(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Nova colmeia
            </Button>
          }
        />
      ) : (
        <ul className="-mt-4">
          {colmeias.map((colmeia) => (
            <li key={colmeia.id} className="flex items-center gap-2 border-b border-ink/10">
              <Link
                to={`/app/colmeias/${colmeia.id}`}
                className="press focus-ring group grid min-w-0 flex-1 grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 rounded py-4 hover:bg-ink/[0.03] md:grid-cols-[6.5rem_1fr_12rem_9rem]"
              >
                <span className="hidden font-dados text-sm text-ink md:block">{colmeia.codigo || "—"}</span>
                <span className="min-w-0">
                  <span className="block truncate font-bold text-ink group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
                    {colmeia.nome}
                  </span>
                  <span className="block truncate text-sm text-ink/65">
                    <span className="font-dados md:hidden">{colmeia.codigo ? `${colmeia.codigo} · ` : ""}</span>
                    {colmeia.especie}
                    {colmeia.localizacao ? ` · ${colmeia.localizacao}` : ""}
                  </span>
                </span>
                <span className="hidden truncate text-sm text-ink/70 md:block">
                  {colmeia.meliponario_id ? nomeMeliponario.get(colmeia.meliponario_id) ?? "—" : "Sem meliponário"}
                </span>
                <span className="text-right md:text-left">
                  <StatusBadge status={colmeia.status} />
                </span>
              </Link>
              <button
                type="button"
                className="press focus-ring inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-ink/45 hover:bg-status-risco/50 hover:text-status-risco-texto"
                onClick={() => handleDelete(colmeia)}
                aria-label={`Excluir a colmeia ${colmeia.nome}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet aberto={formAberto} onFechar={() => setFormAberto(false)} titulo="Nova colmeia">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <label className="campo-rotulo">
              Nome
              <input
                className="campo"
                value={form.nome}
                onChange={(event) => updateField("nome", event.target.value)}
                placeholder="Ex.: Jataí do muro"
                required
                autoFocus
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="campo-rotulo">
                Código
                <input
                  className="campo font-dados"
                  value={form.codigo}
                  onChange={(event) => updateField("codigo", event.target.value.toUpperCase())}
                  placeholder="JAT-001"
                />
              </label>
              <label className="campo-rotulo">
                Espécie
                <input
                  className="campo"
                  list="especies-comuns"
                  value={form.especie}
                  onChange={(event) => updateField("especie", event.target.value)}
                  required
                />
                <datalist id="especies-comuns">
                  {especiesComuns.map((e) => (
                    <option key={e} value={e} />
                  ))}
                </datalist>
              </label>
            </div>
            <label className="campo-rotulo">
              Meliponário
              <select className="campo" value={form.meliponario_id} onChange={(event) => updateField("meliponario_id", event.target.value)}>
                <option value="">Sem meliponário</option>
                {meliponarios.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="campo-rotulo">
              Onde fica no meliponário
              <input
                className="campo"
                value={form.localizacao}
                onChange={(event) => updateField("localizacao", event.target.value)}
                placeholder="Ex.: prateleira 2, lado da sombra"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="campo-rotulo">
                Situação
                <select className="campo" value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                  <option value="ativa">Em dia</option>
                  <option value="observacao">Em observação</option>
                  <option value="risco">Em risco</option>
                  <option value="inativa">Inativa</option>
                </select>
              </label>
              <label className="campo-rotulo">
                Instalada em
                <input
                  type="date"
                  className="campo"
                  value={form.instalada_em}
                  onChange={(event) => updateField("instalada_em", event.target.value)}
                />
              </label>
            </div>
            <label className="campo-rotulo">
              Anotações
              <textarea className="campo" value={form.descricao} onChange={(event) => updateField("descricao", event.target.value)} />
            </label>
          </div>

          {erroForm ? (
            <p role="alert" className="mt-4 text-sm font-bold text-status-risco-texto">
              {erroForm}
            </p>
          ) : null}
          <button type="submit" disabled={saving} className={botao("primary", "mt-6 min-h-12 w-full")}>
            {saving ? "Salvando…" : "Salvar colmeia"}
          </button>
        </form>
      </Sheet>
    </>
  );
}

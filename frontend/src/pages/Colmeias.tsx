import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Eye, Flower2, Plus, Trash2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHeader } from "../components/ui/PageHeader";
import { StatusBadge } from "../components/ui/StatusBadge";
import { criarColmeia, excluirColmeia, listarColmeias } from "../services/colmeias";
import type { Colmeia, StatusColmeia } from "../types";

const initialForm = {
  nome: "",
  codigo: "",
  especie: "Jataí",
  localizacao: "",
  descricao: "",
  status: "ativa" as StatusColmeia,
  instalada_em: "",
};

export function Colmeias() {
  const [colmeias, setColmeias] = useState<Colmeia[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      setColmeias(await listarColmeias());
    } catch {
      setError("Não foi possível carregar as colmeias.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateField(key: keyof typeof form, value: string) {
    setForm((state) => ({ ...state, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await criarColmeia({
        nome: form.nome,
        codigo: form.codigo || null,
        especie: form.especie,
        localizacao: form.localizacao || null,
        descricao: form.descricao || null,
        status: form.status,
        instalada_em: form.instalada_em || null,
      });
      setForm(initialForm);
      await loadData();
    } catch {
      setError("Não foi possível criar a colmeia.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta colmeia?")) return;
    await excluirColmeia(id);
    await loadData();
  }

  if (loading) return <LoadingState />;

  return (
    <>
      <PageHeader
        title="Colmeias"
        description="Cadastro das colônias monitoradas pelo SmartHive."
      />

      {error ? (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.55fr]">
        <form onSubmit={handleSubmit} className="surface rounded-xl p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-hive-50 p-3 text-hive-700">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-950">Nova colmeia</h2>
              <p className="text-sm text-slate-500">Identificação e localização da colônia.</p>
            </div>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Nome
              <input
                className="focus-ring rounded-lg border border-slate-200 bg-white px-3 py-2"
                value={form.nome}
                onChange={(event) => updateField("nome", event.target.value)}
                required
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Código
                <input
                  className="focus-ring rounded-lg border border-slate-200 bg-white px-3 py-2"
                  value={form.codigo}
                  onChange={(event) => updateField("codigo", event.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Espécie
                <input
                  className="focus-ring rounded-lg border border-slate-200 bg-white px-3 py-2"
                  value={form.especie}
                  onChange={(event) => updateField("especie", event.target.value)}
                  required
                />
              </label>
            </div>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Localização
              <input
                className="focus-ring rounded-lg border border-slate-200 bg-white px-3 py-2"
                value={form.localizacao}
                onChange={(event) => updateField("localizacao", event.target.value)}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Status
                <select
                  className="focus-ring rounded-lg border border-slate-200 bg-white px-3 py-2"
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value)}
                >
                  <option value="ativa">Ativa</option>
                  <option value="observacao">Observação</option>
                  <option value="risco">Risco</option>
                  <option value="inativa">Inativa</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Instalada em
                <input
                  type="date"
                  className="focus-ring rounded-lg border border-slate-200 bg-white px-3 py-2"
                  value={form.instalada_em}
                  onChange={(event) => updateField("instalada_em", event.target.value)}
                />
              </label>
            </div>
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Descrição
              <textarea
                className="focus-ring min-h-24 rounded-lg border border-slate-200 bg-white px-3 py-2"
                value={form.descricao}
                onChange={(event) => updateField("descricao", event.target.value)}
              />
            </label>
          </div>

          <div className="mt-5 flex justify-end">
            <Button type="submit" disabled={saving} icon={<Plus className="h-4 w-4" />}>
              {saving ? "Salvando..." : "Criar colmeia"}
            </Button>
          </div>
        </form>

        <div className="surface rounded-xl p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Lista de colmeias</h2>
              <p className="text-sm text-slate-500">{colmeias.length} registros cadastrados</p>
            </div>
          </div>

          {colmeias.length === 0 ? (
            <EmptyState
              icon={<Flower2 className="h-6 w-6" />}
              title="Nenhuma colmeia cadastrada"
              description="Cadastre a primeira colmeia para iniciar o monitoramento."
            />
          ) : (
            <div className="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>Colmeia</th>
                    <th>Espécie</th>
                    <th>Status</th>
                    <th>Localização</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {colmeias.map((colmeia) => (
                    <tr key={colmeia.id}>
                      <td>
                        <div className="font-bold text-slate-950">{colmeia.nome}</div>
                        <div className="text-xs text-slate-500">{colmeia.codigo || colmeia.id}</div>
                      </td>
                      <td>{colmeia.especie}</td>
                      <td>
                        <StatusBadge status={colmeia.status} />
                      </td>
                      <td>{colmeia.localizacao || "-"}</td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/app/colmeias/${colmeia.id}`}
                            className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            aria-label="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
                            onClick={() => handleDelete(colmeia.id)}
                            aria-label="Excluir colmeia"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {colmeias.some((colmeia) => colmeia.status === "risco") ? (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              Há colmeias em risco. Abra cada uma para ver os últimos monitoramentos.
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}

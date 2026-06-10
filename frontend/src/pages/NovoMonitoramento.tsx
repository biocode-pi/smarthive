import { Camera, Save } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { FormField } from "../components/ui/FormField";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHeader } from "../components/ui/PageHeader";
import { listarColmeias } from "../services/colmeias";
import { criarMonitoramento } from "../services/monitoramentos";
import type { Colmeia } from "../types";

const emptyForm = {
  colmeia_id: "",
  duracao_segundos: "",
  movimentos_estimados: "",
  abelhas_entrando: "",
  abelhas_saindo: "",
  fluxo_estimado: "",
  temperatura_c: "",
  umidade_percentual: "",
  observacoes: "",
  possivel_invasor: false,
};

export function NovoMonitoramento() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [colmeias, setColmeias] = useState<Colmeia[]>([]);
  const [form, setForm] = useState({ ...emptyForm, colmeia_id: id ?? "" });
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarColmeias()
      .then((items) => {
        setColmeias(items);
        if (!id && items[0]) {
          setForm((state) => ({ ...state, colmeia_id: items[0].id }));
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  function setField(key: keyof typeof form, value: string | boolean) {
    setForm((state) => ({ ...state, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData();
    formData.append("colmeia_id", form.colmeia_id);
    formData.append("origem", "manual");
    formData.append("possivel_invasor", String(form.possivel_invasor));
    Object.entries(form).forEach(([key, value]) => {
      if (key !== "colmeia_id" && key !== "possivel_invasor" && value !== "") {
        formData.append(key, String(value));
      }
    });
    if (arquivo) formData.append("arquivo", arquivo);

    try {
      await criarMonitoramento(formData);
      navigate(`/colmeias/${form.colmeia_id}`);
    } catch {
      setError("Nao foi possivel registrar o monitoramento.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <>
      <PageHeader
        title="Novo monitoramento"
        description="Registre observacoes de campo, fluxo estimado e midia capturada pelo celular para manter o historico da colmeia."
      />

      <form onSubmit={handleSubmit} className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
        {error ? <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <FormField label="Colmeia">
            <select
              className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
              value={form.colmeia_id}
              onChange={(event) => setField("colmeia_id", event.target.value)}
              required
            >
              {colmeias.map((colmeia) => (
                <option key={colmeia.id} value={colmeia.id}>
                  {colmeia.nome} - {colmeia.especie}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Duracao da observacao (segundos)">
            <input
              type="number"
              min="0"
              className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
              value={form.duracao_segundos}
              onChange={(event) => setField("duracao_segundos", event.target.value)}
            />
          </FormField>
          <FormField label="Movimentos estimados">
            <input
              type="number"
              min="0"
              className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
              value={form.movimentos_estimados}
              onChange={(event) => setField("movimentos_estimados", event.target.value)}
            />
          </FormField>
          <FormField label="Abelhas entrando">
            <input
              type="number"
              min="0"
              className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
              value={form.abelhas_entrando}
              onChange={(event) => setField("abelhas_entrando", event.target.value)}
            />
          </FormField>
          <FormField label="Abelhas saindo">
            <input
              type="number"
              min="0"
              className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
              value={form.abelhas_saindo}
              onChange={(event) => setField("abelhas_saindo", event.target.value)}
            />
          </FormField>
          <FormField label="Fluxo estimado total">
            <input
              type="number"
              min="0"
              className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
              value={form.fluxo_estimado}
              onChange={(event) => setField("fluxo_estimado", event.target.value)}
            />
          </FormField>
          <FormField label="Temperatura (C)">
            <input
              type="number"
              step="0.1"
              className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
              value={form.temperatura_c}
              onChange={(event) => setField("temperatura_c", event.target.value)}
            />
          </FormField>
          <FormField label="Umidade (%)">
            <input
              type="number"
              step="0.1"
              className="focus-ring w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
              value={form.umidade_percentual}
              onChange={(event) => setField("umidade_percentual", event.target.value)}
            />
          </FormField>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <FormField label="Imagem ou video do celular">
            <input
              type="file"
              accept="image/*,video/*"
              capture="environment"
              className="focus-ring w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm"
              onChange={(event) => setArquivo(event.target.files?.[0] ?? null)}
            />
          </FormField>
          <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-hive-600 focus:ring-hive-500"
              checked={form.possivel_invasor}
              onChange={(event) => setField("possivel_invasor", event.target.checked)}
            />
            <span className="text-sm font-semibold text-slate-700">Possivel invasor observado</span>
          </label>
        </div>

        <FormField label="Observacoes">
          <textarea
            className="focus-ring mt-4 min-h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
            value={form.observacoes}
            onChange={(event) => setField("observacoes", event.target.value)}
          />
        </FormField>

        <div className="mt-5 flex justify-end">
          <Button type="submit" disabled={saving || !form.colmeia_id} icon={saving ? <Camera className="h-4 w-4" /> : <Save className="h-4 w-4" />}>
            {saving ? "Salvando..." : "Salvar monitoramento"}
          </Button>
        </div>
      </form>
    </>
  );
}

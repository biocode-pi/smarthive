import { Plus, Search } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { botao } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHeader } from "../components/ui/PageHeader";
import { Sheet } from "../components/ui/Sheet";
import { Hexa } from "../components/ui/StatusBadge";
import { criarMeliponario, listarMeliponarios, type MeliponarioPayload } from "../services/meliponarios";
import type { Meliponario } from "../types";
import { cn } from "../utils/classNames";
import { formatNumber } from "../utils/formatters";

const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");

export function enderecoCompleto(m: Pick<Meliponario, "endereco" | "cidade" | "uf">) {
  return [m.cidade, m.endereco].filter(Boolean).join(", ");
}

export function SeloAlertas({ alertas }: { alertas: number }) {
  return alertas > 0 ? (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-bold text-status-risco-texto">
      <Hexa status="risco" />
      {alertas} {alertas === 1 ? "alerta" : "alertas"}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-bold text-status-ativa-texto">
      <Hexa status="ativa" />
      Em dia
    </span>
  );
}

const vazio: MeliponarioPayload = { nome: "", endereco: "", cidade: "", uf: "SP", descricao: "" };

export function Meliponarios() {
  const [todos, setTodos] = useState<Meliponario[]>([]);
  const [busca, setBusca] = useState("");
  const [somenteAlerta, setSomenteAlerta] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [form, setForm] = useState<MeliponarioPayload>(vazio);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  async function carregar() {
    try {
      setTodos(await listarMeliponarios());
      setErro(null);
    } catch {
      setErro("Não foi possível carregar os meliponários.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const visiveis = useMemo(() => {
    const termo = busca
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim();
    return todos.filter((m) => {
      if (somenteAlerta && m.alertas_abertos === 0) return false;
      if (!termo) return true;
      const alvo = `${m.nome} ${m.cidade ?? ""} ${m.endereco ?? ""}`
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase();
      return alvo.includes(termo);
    });
  }, [todos, busca, somenteAlerta]);

  const totais = {
    meliponarios: todos.length,
    colmeias: todos.reduce((soma, m) => soma + m.total_colmeias, 0),
    alertas: todos.reduce((soma, m) => soma + m.alertas_abertos, 0),
  };

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.nome.trim().length < 2) {
      setErroForm("Informe o nome do meliponário.");
      return;
    }
    setSalvando(true);
    setErroForm(null);
    try {
      await criarMeliponario({
        nome: form.nome.trim(),
        endereco: form.endereco?.trim() || null,
        cidade: form.cidade?.trim() || null,
        uf: form.uf || null,
        descricao: form.descricao?.trim() || null,
      });
      setForm(vazio);
      setFormAberto(false);
      await carregar();
    } catch {
      setErroForm("Não foi possível salvar. Confira os dados e tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <LoadingState />;

  return (
    <>
      <PageHeader
        title="Meliponários"
        leitura={`${formatNumber(totais.meliponarios)} meliponários · ${formatNumber(totais.colmeias)} colmeias · ${formatNumber(totais.alertas)} ${totais.alertas === 1 ? "alerta aberto" : "alertas abertos"}`}
      >
        <button type="button" onClick={() => setFormAberto(true)} className={botao("primary", "hidden lg:inline-flex")}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Novo meliponário
        </button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex h-12 flex-1 items-center gap-3 rounded-full bg-white px-5 ring-1 ring-ink/15 focus-within:ring-2 focus-within:ring-ink">
          <Search className="h-4 w-4 text-ink/60" aria-hidden="true" />
          <label htmlFor="busca" className="sr-only">
            Buscar por nome ou cidade
          </label>
          <input
            id="busca"
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou cidade"
            className="h-full min-w-0 flex-1 bg-transparent text-ink placeholder:text-ink/45 focus:outline-none"
          />
        </div>

        <div className="inline-flex w-fit rounded-full bg-ink/10 p-1" role="group" aria-label="Filtro">
          {[
            { rotulo: "Todos", ativo: !somenteAlerta, valor: false },
            { rotulo: "Com alerta", ativo: somenteAlerta, valor: true },
          ].map((filtro) => (
            <button
              key={filtro.rotulo}
              type="button"
              aria-pressed={filtro.ativo}
              onClick={() => setSomenteAlerta(filtro.valor)}
              className={cn(
                "focus-ring min-h-10 rounded-full px-4 text-sm font-bold",
                filtro.ativo ? "bg-ink text-honey-500" : "text-ink/70 hover:text-ink",
              )}
            >
              {filtro.rotulo}
            </button>
          ))}
        </div>
      </div>

      {erro ? <p className="mt-6 font-bold text-status-risco-texto">{erro}</p> : null}

      {visiveis.length ? (
        <ul className="mt-8 border-t border-ink/15 pb-24 lg:pb-0">
          {visiveis.map((m) => (
            <li key={m.id}>
              <Link
                to={`/app/meliponarios/${m.id}`}
                className="press focus-ring group grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 rounded border-b border-ink/10 py-5 hover:bg-ink/[0.03] sm:grid-cols-[1fr_8rem_9rem]"
              >
                <span className="min-w-0">
                  <span className="block truncate font-expo text-2xl font-bold text-ink [font-stretch:106%] group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
                    {m.nome}
                  </span>
                  <span className="mt-1 block truncate text-sm text-ink/65">
                    {enderecoCompleto(m) ? `${enderecoCompleto(m)}${m.uf ? ` · ${m.uf}` : ""}` : "Endereço não informado"}
                  </span>
                </span>
                <span className="tabular text-right font-dados text-ink">
                  <span className="text-2xl font-medium">{m.total_colmeias}</span>
                  <span className="ml-1.5 text-xs text-ink/60">{m.total_colmeias === 1 ? "colmeia" : "colmeias"}</span>
                </span>
                <span className="col-span-2 sm:col-span-1 sm:text-right">
                  <SeloAlertas alertas={m.alertas_abertos} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {!visiveis.length && !erro ? (
        <div className="mt-8">
          <EmptyState
            title={todos.length ? "Nenhum meliponário encontrado" : "Nenhum meliponário cadastrado"}
            description={
              todos.length
                ? "Tente outro nome ou cidade, ou volte para Todos."
                : "Cadastre o local onde ficam suas caixas. Depois é só adicionar as colmeias a ele."
            }
            acao={
              todos.length ? null : (
                <button type="button" onClick={() => setFormAberto(true)} className={botao("primary")}>
                  <Plus className="h-4 w-4" aria-hidden="true" /> Novo meliponário
                </button>
              )
            }
          />
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setFormAberto(true)}
        className={botao("primary", "fixed bottom-24 right-4 z-30 min-h-12 shadow-[0_12px_24px_-10px_rgba(18,21,21,0.55)] lg:hidden")}
      >
        <Plus className="h-5 w-5" aria-hidden="true" /> Novo meliponário
      </button>

      <Sheet aberto={formAberto} onFechar={() => setFormAberto(false)} titulo="Novo meliponário">
          <form onSubmit={salvar}>
            <div className="space-y-3">
              {(
                [
                  ["nome", "Nome", "Ex.: Meliponário do Horto"],
                  ["endereco", "Endereço", "Rua e número"],
                  ["cidade", "Cidade", "Ex.: Jacupiranga"],
                ] as const
              ).map(([campo, rotulo, dica]) => (
                <label key={campo} className="campo-rotulo">
                  {rotulo}
                  <input
                    value={form[campo] ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, [campo]: e.target.value }))}
                    placeholder={dica}
                    className="campo"
                    autoFocus={campo === "nome"}
                  />
                </label>
              ))}
              <label className="campo-rotulo">
                UF
                <select
                  value={form.uf ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, uf: e.target.value }))}
                  className="campo"
                >
                  {UFS.map((uf) => (
                    <option key={uf}>{uf}</option>
                  ))}
                </select>
              </label>
            </div>
            {erroForm ? <p className="mt-3 text-sm font-bold text-status-risco-texto">{erroForm}</p> : null}
            <button
              type="submit"
              disabled={salvando}
              className={botao("primary", "mt-6 min-h-12 w-full")}
            >
              {salvando ? "Salvando..." : "Salvar meliponário"}
            </button>
          </form>
      </Sheet>
    </>
  );
}

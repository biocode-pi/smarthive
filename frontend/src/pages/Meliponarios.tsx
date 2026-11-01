import { Archive, Bell, CheckCircle2, MapPin, Plus, Search, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingState } from "../components/ui/LoadingState";
import { criarMeliponario, listarMeliponarios, type MeliponarioPayload } from "../services/meliponarios";
import type { Meliponario } from "../types";
import { cn } from "../utils/classNames";

const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");

export function enderecoCompleto(m: Pick<Meliponario, "endereco" | "cidade" | "uf">) {
  // Mesmo formato do card do app: "Cidade, Endereco".
  return [m.cidade, m.endereco].filter(Boolean).join(", ");
}

/** Selo "Em dia" / "N alertas", como no card do app. */
export function SeloAlertas({ alertas }: { alertas: number }) {
  return alertas > 0 ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-status-risco px-3 py-0.5 text-xs font-bold uppercase text-status-risco-texto">
      <Bell className="h-3.5 w-3.5" aria-hidden="true" />
      {alertas} {alertas === 1 ? "alerta" : "alertas"}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-status-ativa px-3 py-0.5 text-xs font-bold uppercase text-status-ativa-texto">
      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
      Em dia
    </span>
  );
}

function ResumoTile({ valor, rotulo, alerta = false }: { valor: number; rotulo: string; alerta?: boolean }) {
  return (
    <div className="rounded-field bg-honey-100 px-4 py-2">
      <p className={cn("text-2xl font-bold", alerta && valor > 0 ? "text-[#b00000]" : "text-ink")}>{valor}</p>
      <p className="text-xs font-bold text-honey-700">{rotulo}</p>
    </div>
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

  // Busca e filtro no navegador: a lista e pequena e a resposta fica instantanea.
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
      <section className="-mx-4 -mt-6 mb-6 rounded-b-[30px] bg-honey-400 px-4 pb-6 pt-6 sm:-mx-6 sm:px-6 lg:mx-0 lg:mt-0 lg:rounded-none lg:bg-transparent lg:p-0">
        <div className="lg:flex lg:items-end lg:justify-between lg:gap-6">
          <div>
            <p className="text-xs font-bold uppercase text-honey-700 lg:hidden">Bem-vindo</p>
            <h1 className="text-2xl font-bold uppercase text-ink lg:text-3xl lg:normal-case">Meliponários</h1>
            <p className="hidden text-slate-700 lg:mt-1 lg:block">Locais onde ficam suas colmeias, com o status de cada um.</p>
          </div>
          <button
            type="button"
            onClick={() => setFormAberto(true)}
            className="focus-ring hidden h-11 items-center gap-2 rounded-field bg-ink px-4 font-black text-honey-400 shadow-app hover:bg-black lg:inline-flex"
          >
            <Plus className="h-5 w-5" aria-hidden="true" /> Novo meliponário
          </button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:max-w-lg lg:mt-6">
          <ResumoTile valor={totais.meliponarios} rotulo="Meliponários" />
          <ResumoTile valor={totais.colmeias} rotulo="Colmeias" />
          <ResumoTile valor={totais.alertas} rotulo="Alertas" alerta />
        </div>
      </section>

      <div className="lg:flex lg:items-center lg:gap-4">

      <div className="flex h-[61px] items-center gap-3 rounded-card bg-white px-5 shadow-app focus-within:ring-2 focus-within:ring-ink lg:h-12 lg:flex-1 lg:rounded-field">
        <Search className="h-5 w-5 text-ink" aria-hidden="true" />
        <label htmlFor="busca" className="sr-only">
          Buscar por nome ou cidade
        </label>
        <input
          id="busca"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou cidade"
          className="h-full min-w-0 flex-1 bg-transparent font-bold text-ink placeholder:text-slate-600 focus:outline-none"
        />
      </div>

      <div className="mt-5 flex gap-3 lg:mt-0" role="group" aria-label="Filtro">
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
              "focus-ring min-h-9 rounded-[5px] px-5 text-xs font-bold uppercase text-ink",
              filtro.ativo ? "bg-honey-400" : "border border-ink bg-honey-200",
            )}
          >
            {filtro.rotulo}
          </button>
        ))}
      </div>
      </div>

      {erro ? <p className="mt-6 rounded-field bg-white p-4 font-bold text-status-risco-texto shadow-app">{erro}</p> : null}

      <ul className="mt-6 grid gap-5 pb-24 md:grid-cols-2 lg:pb-0 xl:grid-cols-3">
        {visiveis.map((m) => (
          <li key={m.id}>
            <Link
              to={`/app/meliponarios/${m.id}`}
              className="focus-ring flex gap-3 rounded-card bg-white p-4 shadow-app transition hover:-translate-y-0.5"
            >
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-field bg-honey-100 text-honey-600">
                <Archive className="h-6 w-6" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold text-ink">{m.nome}</span>
                {enderecoCompleto(m) ? (
                  <span className="mt-0.5 flex items-center gap-1 text-sm font-bold text-[#5c5c5c]">
                    <MapPin className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    <span className="truncate">{enderecoCompleto(m)}</span>
                  </span>
                ) : null}
                <span className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#d9d9d9] px-3 py-0.5 text-xs font-bold text-ink">
                    <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                    {m.total_colmeias} <span className="sr-only">colmeias</span>
                  </span>
                  <SeloAlertas alertas={m.alertas_abertos} />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {!visiveis.length && !erro ? (
        <div className="mt-6">
          <EmptyState
            title={todos.length ? "Nenhum meliponário encontrado" : "Nenhum meliponário cadastrado"}
            description={todos.length ? "Tente outro nome ou cidade, ou limpe o filtro." : "Cadastre o local onde ficam suas colmeias."}
          />
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setFormAberto(true)}
        className="focus-ring fixed bottom-24 right-4 z-30 inline-flex h-[49px] items-center gap-2 rounded-[15px] bg-ink px-4 font-black text-honey-400 shadow-app lg:hidden"
      >
        <Plus className="h-6 w-6" aria-hidden="true" /> Novo meliponário
      </button>

      {formAberto ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="titulo-novo">
          <form onSubmit={salvar} className="w-full max-w-md rounded-card bg-honey-50 p-6 shadow-app">
            <div className="flex items-center justify-between">
              <h2 id="titulo-novo" className="text-xl font-bold text-ink">
                Novo meliponário
              </h2>
              <button type="button" onClick={() => setFormAberto(false)} className="focus-ring rounded-lg p-1" aria-label="Fechar">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {(
                [
                  ["nome", "Nome", "Ex.: Meliponário do Horto"],
                  ["endereco", "Endereço", "Rua e número"],
                  ["cidade", "Cidade", "Ex.: Jacupiranga"],
                ] as const
              ).map(([campo, rotulo, dica]) => (
                <label key={campo} className="block text-sm font-bold text-ink">
                  {rotulo}
                  <input
                    value={form[campo] ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, [campo]: e.target.value }))}
                    placeholder={dica}
                    className="mt-1 h-[50px] w-full rounded-field bg-white px-4 font-normal shadow-app focus:outline-none focus:ring-2 focus:ring-ink"
                    autoFocus={campo === "nome"}
                  />
                </label>
              ))}
              <label className="block text-sm font-bold text-ink">
                UF
                <select
                  value={form.uf ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, uf: e.target.value }))}
                  className="mt-1 h-[50px] w-full rounded-field bg-white px-4 font-normal shadow-app focus:outline-none focus:ring-2 focus:ring-ink"
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
              className="focus-ring mt-5 h-[50px] w-full rounded-field bg-hive-600 font-bold text-ink shadow-app hover:brightness-95 disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "Salvar meliponário"}
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}

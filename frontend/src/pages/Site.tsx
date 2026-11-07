import { ArrowDown, ArrowRight, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import { InstrumentoEntrada } from "../components/site/InstrumentoEntrada";
import { FavoMap, LegendaFavo, type CelulaFavo } from "../components/ui/FavoMap";
import { Marca } from "../components/ui/Marca";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { href: "#abelhas", label: "Abelhas nativas" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#mapa", label: "Mapa do meliponário" },
];

// Exemplo ilustrativo do mapa do meliponario. Como na plataforma, a colmeia mais grave fica no centro.
const meliponarioExemplo: CelulaFavo[] = [
  { id: "6", codigo: "MIR-005", nome: "Mirim", status: "risco", detalhe: "3 mov." },
  { id: "1", codigo: "URU-004", nome: "Uruçu", status: "ativa", detalhe: "52 mov." },
  { id: "2", codigo: "JAT-001", nome: "Jataí", status: "ativa", detalhe: "41 mov." },
  { id: "3", codigo: "JAT-002", nome: "Jataí", status: "ativa", detalhe: "36 mov." },
  { id: "4", codigo: "MAN-003", nome: "Mandaçaia", status: "observacao", detalhe: "12 mov." },
  { id: "5", codigo: "IRA-006", nome: "Iraí", status: "ativa", detalhe: "28 mov." },
  { id: "7", codigo: "TUB-007", nome: "Tubuna", status: "ativa", detalhe: "33 mov." },
];

const especies = [
  { nome: "Jataí", cientifico: "Tetragonisca angustula" },
  { nome: "Mandaçaia", cientifico: "Melipona quadrifasciata" },
  { nome: "Uruçu", cientifico: "Melipona scutellaris" },
  { nome: "Mirim", cientifico: "Plebeia spp." },
  { nome: "Iraí", cientifico: "Nannotrigona testaceicornis" },
  { nome: "Tubuna", cientifico: "Scaptotrigona bipunctata" },
];

// A ordem importa: e o caminho de um registro, do campo ate a decisao de manejo.
const steps = [
  { title: "Capturar", text: "O meliponicultor registra a entrada da colmeia pelo celular ou por um dispositivo IoT." },
  { title: "Enviar", text: "A captura segue criptografada para a nuvem." },
  { title: "Analisar", text: "A plataforma estima o fluxo de abelhas e compara com o histórico da colmeia." },
  { title: "Agir", text: "Dashboard e alertas mostram onde o manejo é necessário." },
];

const destaquesMapa = [
  { termo: "Cor pela situação", texto: "Verde em dia, amarelo em observação, vermelho em risco." },
  { termo: "A mais grave no centro", texto: "A colmeia que precisa de atenção primeiro fica no meio do favo." },
  { termo: "Mesma conta no celular", texto: "No campo pelo aplicativo, no escritório pelo navegador." },
];

// Miniatura do que acontece em cada etapa, com o vocabulario visual da propria plataforma.
function ArtefatoEtapa({ indice }: { indice: number }) {
  if (indice === 0) {
    return (
      <div className="relative h-full">
        <span className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-ink" />
        <span className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-ink" />
        <span className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-ink" />
        <span className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-ink" />
        <span className="absolute left-1/2 top-1/2 h-5 w-9 -translate-x-1/2 -translate-y-1/2 rounded-md bg-hive-700" />
        <span className="absolute left-1/2 top-1/2 h-2.5 w-3.5 -translate-x-[150%] -translate-y-[160%] rounded-full bg-honey-500 ring-1 ring-ink/40" />
        <span className="absolute left-3 top-2.5 flex items-center gap-1.5 font-dados text-[10px] text-ink/70">
          <span className="h-1.5 w-1.5 rounded-full bg-status-risco-texto" /> REC 00:12
        </span>
      </div>
    );
  }
  if (indice === 1) {
    return (
      <div className="flex h-full flex-col justify-center gap-2 font-dados text-[10px] text-ink/70">
        <div className="flex justify-between gap-2">
          <span className="truncate">entrada_0712.mp4</span>
          <span>3,2 MB</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
          <div className="h-full w-[72%] rounded-full bg-ink" />
        </div>
        <span>criptografado · 72%</span>
      </div>
    );
  }
  if (indice === 2) {
    // Movimento dos ultimos sete dias; a linha tracejada e a media da colmeia.
    const barras = [52, 49, 55, 47, 50, 31, 18];
    return (
      <div className="relative flex h-full items-end gap-1.5">
        <span className="absolute inset-x-0 bottom-[84%] border-t border-dashed border-ink/40" />
        {barras.map((v, i) => (
          <span
            key={i}
            className={i === barras.length - 1 ? "flex-1 rounded-t bg-status-risco-texto" : "flex-1 rounded-t bg-ink/80"}
            style={{ height: `${(v / 60) * 100}%` }}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="flex h-full items-center">
      <div className="w-full rounded-xl bg-white p-3 shadow-app">
        <p className="flex items-center gap-1.5 font-dados text-[10px] uppercase tracking-wider text-status-risco-texto">
          <span className="h-1.5 w-1.5 rounded-full bg-status-risco-texto" /> Alerta
        </p>
        <p className="mt-1 text-xs font-bold leading-snug text-ink">MIR-005: atividade bem abaixo do histórico</p>
      </div>
    </div>
  );
}

export function Site() {
  const { user } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Menu fechado fica fora do foco e dos leitores de tela; Esc fecha.
  useEffect(() => {
    if (menuRef.current) menuRef.current.inert = !menuAberto;
    if (!menuAberto) return;
    const tecla = (event: KeyboardEvent) => event.key === "Escape" && setMenuAberto(false);
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [menuAberto]);
  const cta = user ? { to: "/app", label: "Abrir plataforma" } : { to: "/login", label: "Entrar" };

  return (
    <div className="min-h-screen text-ink">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-panel"
      >
        Pular para o conteúdo
      </a>

      <header className="material-mel sticky top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="#inicio" className="focus-ring rounded-lg" aria-label="Smart Hive, início">
            <Marca />
          </a>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Seções do site">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="focus-ring rounded text-sm font-bold text-ink hover:underline underline-offset-4">
                {link.label}
              </a>
            ))}
            <Link
              to={cta.to}
              className="press focus-ring inline-flex min-h-10 items-center rounded-full bg-ink px-5 text-sm font-bold text-honey-500 hover:bg-black"
            >
              {cta.label}
            </Link>
          </nav>

          <button
            type="button"
            className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-lg text-ink md:hidden"
            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuAberto}
            aria-controls="menu-site"
            onClick={() => setMenuAberto((aberto) => !aberto)}
          >
            {menuAberto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Sempre montado: abre e fecha animando a altura e pode inverter no meio. */}
        <div ref={menuRef} id="menu-site" className="recolhivel md:hidden" data-aberto={menuAberto}>
          <div>
            <nav className="flex flex-col gap-1 border-t border-ink/10 px-4 py-3" aria-label="Seções do site">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuAberto(false)}
                  className="press rounded-lg px-3 py-3 text-sm font-bold text-ink hover:bg-white/40"
                >
                  {link.label}
                </a>
              ))}
              <Link to={cta.to} className="press mt-1 rounded-full bg-ink px-3 py-3 text-center text-sm font-bold text-honey-500">
                {cta.label}
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main id="conteudo">
        <section id="inicio" className="bg-honey-500">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-10 sm:px-6 md:pt-16 lg:grid-cols-[1.4fr_1fr] lg:gap-14 lg:pb-28">
            <div>
              <p className="font-dados text-xs uppercase tracking-[0.18em] text-ink/70">Monitoramento de meliponários</p>
              <h1 className="mt-5 font-expo text-[clamp(2.4rem,5vw,4.1rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.02em] text-ink [font-stretch:112%]">
                Quem entra e quem sai diz como vai a colmeia.
              </h1>
              <p className="mt-7 max-w-lg text-lg leading-relaxed text-ink/80">
                O Smart Hive estima o movimento na entrada de cada colmeia a partir de fotos e vídeos feitos em campo,
                guarda o histórico e avisa quando a atividade cai ou aparece um invasor.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
                <Link
                  to={cta.to}
                  className="press focus-ring inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-6 font-bold text-honey-500 hover:bg-black"
                >
                  {user ? "Abrir plataforma" : "Entrar na plataforma"} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a
                  href="#como-funciona"
                  className="focus-ring inline-flex items-center gap-1.5 rounded font-bold text-ink underline decoration-2 underline-offset-[6px] hover:decoration-ink/40"
                >
                  Como funciona <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
            <InstrumentoEntrada />
          </div>
        </section>

        <section id="abelhas" className="bg-honey-50 py-20 lg:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <h2 className="font-expo text-4xl font-extrabold leading-none text-ink [font-stretch:112%] sm:text-5xl">
                Feito para abelhas nativas sem ferrão
              </h2>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/75">
                Essenciais para a polinização e a biodiversidade, as colônias ainda são acompanhadas, na maioria dos
                meliponários, por observação e anotações em papel. O Smart Hive organiza esse acompanhamento colmeia a
                colmeia, para o manejo do dia a dia e para a pesquisa.
              </p>
            </div>
            <ul className="border-t border-ink/15">
              {especies.map((e) => (
                <li key={e.nome} className="flex items-baseline justify-between gap-6 border-b border-ink/15 py-4">
                  <span className="font-expo text-2xl font-bold text-ink [font-stretch:108%] sm:text-3xl">{e.nome}</span>
                  <span className="text-right text-sm italic text-ink/60">{e.cientifico}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="como-funciona" className="bg-white py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="max-w-2xl font-expo text-4xl font-extrabold leading-none text-ink [font-stretch:112%] sm:text-5xl">
              Do campo à decisão de manejo
            </h2>
            <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {steps.map((step, index) => (
                <li key={step.title} className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <span className="font-dados text-sm text-hive-700">0{index + 1}</span>
                    <span className="h-px flex-1 bg-ink/15" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-expo text-2xl font-bold text-ink [font-stretch:108%]">{step.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{step.text}</p>
                  <div className="mt-auto pt-6" aria-hidden="true">
                    <div className="h-28 rounded-2xl bg-honey-50 p-4">
                      <ArtefatoEtapa indice={index} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="mapa" className="bg-honey-500 py-20 lg:py-28">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
            <figure className="order-last rounded-[28px] bg-white p-6 shadow-[0_24px_48px_-20px_rgba(18,21,21,0.35)] sm:p-8 lg:order-first">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-lg font-bold text-ink">Meliponário Horto</p>
                <p className="font-dados text-xs text-ink/60">7 colmeias</p>
              </div>
              <FavoMap celulas={meliponarioExemplo} className="mx-auto mt-5 max-w-sm" titulo="Exemplo de mapa do meliponário" />
              <div className="mt-5 border-t border-ink/10 pt-4">
                <LegendaFavo celulas={meliponarioExemplo} />
              </div>
              <figcaption className="sr-only">
                Exemplo do mapa da plataforma: cada hexágono é uma colmeia, com o movimento estimado na última captura.
              </figcaption>
            </figure>
            <div>
              <h2 className="font-expo text-4xl font-extrabold leading-none text-ink [font-stretch:112%] sm:text-5xl">
                O meliponário inteiro numa tela
              </h2>
              <dl className="mt-10 space-y-7">
                {destaquesMapa.map(({ termo, texto }) => (
                  <div key={termo} className="border-l-4 border-ink pl-5">
                    <dt className="font-expo text-xl font-bold text-ink [font-stretch:108%]">{termo}</dt>
                    <dd className="mt-1 text-ink/75">{texto}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section className="bg-ink py-20 text-white lg:py-24">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-3xl font-expo text-4xl font-extrabold uppercase leading-[0.95] text-white [font-stretch:118%] sm:text-6xl">
              Comece pelo seu <span className="text-honey-500">meliponário.</span>
            </h2>
            <Link
              to={cta.to}
              className="press focus-ring inline-flex min-h-12 flex-shrink-0 items-center gap-2 rounded-full bg-honey-500 px-6 font-bold text-ink hover:brightness-95 focus:ring-offset-ink"
            >
              {user ? "Abrir plataforma" : "Criar conta ou entrar"} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-white/10 px-4 py-6 text-sm text-white/70 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} Smart Hive</span>
          <nav className="flex gap-5" aria-label="Documentos">
            <Link to="/termos" className="focus-ring rounded hover:text-honey-500 focus:ring-offset-ink">
              Termos de Uso
            </Link>
            <Link to="/privacidade" className="focus-ring rounded hover:text-honey-500 focus:ring-offset-ink">
              Política de Privacidade
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

import { Activity, ArrowRight, Bell, Camera, Flower2, LineChart, Menu, Smartphone, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { FavoMap, LegendaFavo, type CelulaFavo } from "../components/ui/FavoMap";
import { Marca } from "../components/ui/Marca";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { href: "#sobre", label: "Sobre" },
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#como-funciona", label: "Como funciona" },
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

const features = [
  {
    icon: Flower2,
    title: "Gestão de colmeias",
    text: "Cadastro de cada colmeia com espécie, localização e histórico completo.",
  },
  {
    icon: Camera,
    title: "Captura em campo",
    text: "Fotos e vídeos da entrada da colmeia registrados direto pelo celular.",
  },
  {
    icon: Activity,
    title: "Análise automatizada",
    text: "As capturas viram uma estimativa do nível de atividade de cada colmeia.",
  },
  {
    icon: Bell,
    title: "Alertas",
    text: "Aviso quando a atividade cai ou aparece um possível invasor.",
  },
  {
    icon: LineChart,
    title: "Dashboard",
    text: "Indicadores e histórico para acompanhar a saúde do meliponário ao longo do tempo.",
  },
  {
    icon: Smartphone,
    title: "Web e celular",
    text: "A mesma conta na plataforma web e no aplicativo, com os dados sincronizados.",
  },
];

// A ordem importa: e o caminho de um registro, do campo ate a decisao de manejo.
const steps = [
  { title: "Capturar", text: "O meliponicultor registra a entrada da colmeia pelo celular ou por um dispositivo IoT." },
  { title: "Enviar", text: "A captura segue criptografada para a nuvem." },
  { title: "Analisar", text: "A plataforma estima o fluxo de abelhas e compara com o histórico da colmeia." },
  { title: "Agir", text: "Dashboard e alertas mostram onde o manejo é necessário." },
];

export function Site() {
  const { user } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const cta = user ? { to: "/app", label: "Abrir plataforma" } : { to: "/login", label: "Entrar" };

  return (
    <div className="min-h-screen text-ink">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-panel"
      >
        Pular para o conteúdo
      </a>

      <header className="sticky top-0 z-30 bg-honey-500">
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
              className="focus-ring inline-flex min-h-10 items-center rounded-field bg-ink px-4 text-sm font-bold text-honey-400 shadow-app hover:bg-black"
            >
              {cta.label}
            </Link>
          </nav>

          <button
            type="button"
            className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-lg text-ink md:hidden"
            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuAberto}
            onClick={() => setMenuAberto((aberto) => !aberto)}
          >
            {menuAberto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuAberto && (
          <nav className="flex flex-col gap-1 border-t border-ink/10 px-4 py-3 md:hidden" aria-label="Seções do site">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuAberto(false)}
                className="rounded-lg px-3 py-3 text-sm font-bold text-ink hover:bg-white/40"
              >
                {link.label}
              </a>
            ))}
            <Link to={cta.to} className="mt-1 rounded-field bg-ink px-3 py-3 text-center text-sm font-bold text-honey-400">
              {cta.label}
            </Link>
          </nav>
        )}
      </header>

      <main id="conteudo">
        <section id="inicio" className="rounded-b-[30px] bg-honey-500">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-8 sm:px-6 md:grid-cols-[1.05fr_1fr] md:pb-24 md:pt-12">
          <div>
            <p className="font-tagline text-xs font-semibold uppercase tracking-[4px] text-ink">
              Meliponicultura · abelhas sem ferrão
            </p>
            <h1 className="mt-5 text-[2.6rem] font-black leading-[1.05] text-ink sm:text-6xl">
              Cada colmeia do meliponário, acompanhada de perto.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/80">
              O Smart Hive reúne capturas em campo, análise de atividade e alertas numa plataforma única para
              meliponicultores e pesquisadores cuidarem das suas colônias de abelhas nativas.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to={cta.to}
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-field bg-hive-600 px-6 font-bold text-ink shadow-app hover:brightness-95"
              >
                {user ? "Abrir plataforma" : "Entrar na plataforma"} <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#como-funciona"
                className="focus-ring inline-flex min-h-12 items-center justify-center rounded-field bg-white px-6 font-bold text-ink shadow-app hover:bg-honey-50"
              >
                Como funciona
              </a>
            </div>
          </div>

          <figure className="rounded-card bg-white p-5 shadow-app sm:p-7">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-lg font-bold text-ink">Meliponário Horto</p>
              <p className="text-xs font-bold text-slate-600">7 colmeias</p>
            </div>
            <FavoMap celulas={meliponarioExemplo} className="mx-auto mt-4 max-w-sm" titulo="Exemplo de mapa do meliponário" />
            <div className="mt-4 border-t border-border pt-4">
              <LegendaFavo celulas={meliponarioExemplo} />
            </div>
            <figcaption className="mt-3 text-xs text-slate-600">
              Exemplo do mapa da plataforma: cada hexágono é uma colmeia, com o movimento estimado na última captura.
            </figcaption>
          </figure>
          </div>
        </section>

        <section id="sobre" className="py-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-3">
            <h2 className="text-3xl font-bold text-ink">Sobre o projeto</h2>
            <div className="space-y-4 leading-relaxed text-slate-600 md:col-span-2">
              <p>
                As abelhas nativas sem ferrão, como a jataí, a mandaçaia e a uruçu, são essenciais para a polinização
                e a biodiversidade. Ainda assim, o acompanhamento das colmeias costuma depender de observação manual e
                anotações em papel.
              </p>
              <p>
                O Smart Hive registra a atividade de cada colmeia, organiza o histórico e avisa o meliponicultor quando
                algo foge do normal, apoiando o manejo no dia a dia e a pesquisa científica.
              </p>
            </div>
          </div>
        </section>

        <section id="funcionalidades" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-bold text-ink">Funcionalidades</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-card bg-white p-6 shadow-app">
                <span className="inline-flex rounded-field bg-honey-100 p-2.5 text-ink">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="bg-hive-900 py-16 text-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-3xl font-semibold">Como funciona</h2>
            <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <li key={step.title} className="rounded-xl bg-white/5 p-6 ring-1 ring-white/10">
                  <span className="text-sm font-black text-honey-400">{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/75">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

      </main>

      <footer className="border-t border-white/15 bg-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-white/80 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} Smart Hive</span>
          <nav className="flex gap-5" aria-label="Documentos">
            <Link to="/termos" className="focus-ring rounded hover:text-honey-400">
              Termos de Uso
            </Link>
            <Link to="/privacidade" className="focus-ring rounded hover:text-honey-400">
              Política de Privacidade
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

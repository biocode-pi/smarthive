import {
  Activity,
  ArrowRight,
  Bell,
  Camera,
  Cloud,
  Flower2,
  LineChart,
  Menu,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { href: "#sobre", label: "Sobre" },
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#equipe", label: "Equipe" },
];

const features = [
  {
    icon: Flower2,
    title: "Gestao de colmeias",
    text: "Cadastro de colmeias de abelhas nativas com especie, localizacao e historico completo.",
  },
  {
    icon: Camera,
    title: "Captura em campo",
    text: "Registro de imagens e videos da entrada da colmeia direto pelo celular.",
  },
  {
    icon: Activity,
    title: "Analise automatizada",
    text: "Interpretacao das capturas para estimar o nivel de atividade de cada colmeia.",
  },
  {
    icon: Bell,
    title: "Alertas",
    text: "Avisos sobre baixa atividade ou comportamento fora do padrao.",
  },
  {
    icon: LineChart,
    title: "Dashboard",
    text: "Indicadores e historico para acompanhar a saude do meliponario ao longo do tempo.",
  },
  {
    icon: Smartphone,
    title: "Web e mobile",
    text: "Mesma conta na plataforma web e no aplicativo, com dados sincronizados na nuvem.",
  },
];

const steps = [
  { title: "Capturar", text: "O meliponicultor registra a entrada da colmeia pelo celular ou dispositivo IoT." },
  { title: "Enviar", text: "Os dados sao enviados com seguranca para a nuvem." },
  { title: "Analisar", text: "A plataforma processa as capturas e calcula indicadores de atividade." },
  { title: "Agir", text: "Dashboard e alertas apoiam decisoes de manejo." },
];

const team = [
  { name: "Mauricio Rafael", role: "Desenvolvedor" },
  { name: "Bruno Davies", role: "Desenvolvedor" },
  { name: "Bruno Eduardo", role: "Desenvolvedor" },
  { name: "Leonardo Ribeiro", role: "Desenvolvedor" },
];

export function Site() {
  const { user } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const cta = user ? { to: "/app", label: "Abrir plataforma" } : { to: "/login", label: "Entrar" };

  return (
    <div className="min-h-screen text-slate-800">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="#inicio" className="flex items-center gap-2.5">
            <img src={logo} alt="" className="h-9 w-9 object-contain" />
            <span className="text-lg font-bold text-hive-900">SmartHive</span>
          </a>

          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-semibold text-slate-600 hover:text-hive-700">
                {link.label}
              </a>
            ))}
            <Link
              to={cta.to}
              className="inline-flex items-center gap-2 rounded-lg bg-hive-600 px-4 py-2 text-sm font-semibold text-white hover:bg-hive-700"
            >
              {cta.label}
            </Link>
          </nav>

          <button
            type="button"
            className="rounded-lg p-2 text-slate-700 md:hidden"
            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuAberto}
            onClick={() => setMenuAberto((aberto) => !aberto)}
          >
            {menuAberto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuAberto && (
          <nav className="flex flex-col gap-1 border-t border-border px-4 py-3 md:hidden">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuAberto(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-hive-50"
              >
                {link.label}
              </a>
            ))}
            <Link to={cta.to} className="mt-1 rounded-lg bg-hive-600 px-3 py-2 text-center text-sm font-semibold text-white">
              {cta.label}
            </Link>
          </nav>
        )}
      </header>

      <main>
        <section id="inicio" className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex rounded-full bg-honey-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-honey-500">
              Meliponicultura inteligente
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-hive-900 sm:text-5xl">
              Monitoramento de colmeias de abelhas nativas, do campo a nuvem.
            </h1>
            <p className="mt-5 text-lg text-slate-600">
              O SmartHive reune captura em campo, analise automatizada e alertas em uma plataforma unica para
              meliponicultores e pesquisadores acompanharem a saude de suas colmeias.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={cta.to}
                className="inline-flex items-center gap-2 rounded-lg bg-hive-600 px-5 py-3 font-semibold text-white shadow-soft hover:bg-hive-700"
              >
                {cta.label} <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#funcionalidades"
                className="inline-flex items-center rounded-lg border border-border bg-white px-5 py-3 font-semibold text-hive-700 hover:bg-hive-50"
              >
                Conhecer o projeto
              </a>
            </div>
          </div>
          <div className="flex justify-center">
            <img src={logo} alt="Logotipo SmartHive" className="w-full max-w-sm drop-shadow-xl" />
          </div>
        </section>

        <section id="sobre" className="bg-white/70 py-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <h2 className="text-3xl font-bold text-hive-900">Sobre o projeto</h2>
            </div>
            <div className="space-y-4 text-slate-600 md:col-span-2">
              <p>
                As abelhas nativas sem ferrao sao essenciais para a polinizacao e a biodiversidade, mas o
                acompanhamento das colmeias ainda depende quase sempre de observacao manual.
              </p>
              <p>
                O SmartHive automatiza esse acompanhamento: registra a atividade das colmeias, organiza o historico e
                avisa o meliponicultor quando algo foge do normal, facilitando o manejo e a pesquisa.
              </p>
            </div>
          </div>
        </section>

        <section id="funcionalidades" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-bold text-hive-900">Funcionalidades</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-xl border border-border bg-white p-6 shadow-soft">
                <span className="inline-flex rounded-lg bg-hive-50 p-2.5 text-hive-700">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-hive-900">{title}</h3>
                <p className="mt-2 text-sm text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="bg-hive-900 py-16 text-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-3xl font-bold">Como funciona</h2>
            <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <li key={step.title} className="rounded-xl bg-white/5 p-6 ring-1 ring-white/10">
                  <span className="text-sm font-bold text-honey-400">0{index + 1}</span>
                  <h3 className="mt-2 text-lg font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm text-white/70">{step.text}</p>
                </li>
              ))}
            </ol>
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-white/80">
              <span className="inline-flex items-center gap-2">
                <Cloud className="h-4 w-4 text-honey-400" /> Hospedado na AWS
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-honey-400" /> Acesso autenticado e trafego criptografado
              </span>
            </div>
          </div>
        </section>

        <section id="equipe" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-bold text-hive-900">Equipe</h2>
          <p className="mt-2 text-slate-600">Projeto Integrador do 5o semestre - DSM, FATEC.</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <div key={member.name} className="rounded-xl border border-border bg-white p-6 text-center shadow-soft">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-honey-100 text-xl font-bold text-honey-500">
                  {member.name
                    .split(" ")
                    .map((parte) => parte.charAt(0))
                    .join("")}
                </div>
                <p className="mt-4 font-bold text-hive-900">{member.name}</p>
                <p className="text-sm text-slate-500">{member.role}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-white/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:px-6">
          <span>(c) {new Date().getFullYear()} SmartHive</span>
          <a href="https://github.com/biocode-pi/smarthive" target="_blank" rel="noreferrer" className="hover:text-hive-700">
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

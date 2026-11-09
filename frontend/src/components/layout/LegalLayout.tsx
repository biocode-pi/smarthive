import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Marca } from "../ui/Marca";
import { legalConfig } from "../../config/legal.config";

interface LegalLayoutProps {
  titulo: string;
  resumo: string;
  children: ReactNode;
}

/** Layout das paginas de texto legal: leitura confortavel e navegacao entre os documentos. */
export function LegalLayout({ titulo, resumo, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen text-ink">
      <header className="bg-honey-400">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="focus-ring rounded-lg" aria-label="Smart Hive, página inicial">
            <Marca />
          </Link>
          <nav className="flex gap-5 text-sm font-bold text-ink" aria-label="Documentos">
            <Link to="/termos" className="focus-ring rounded hover:text-hive-700">
              Termos de Uso
            </Link>
            <Link to="/privacidade" className="focus-ring rounded hover:text-hive-700">
              Privacidade
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-4xl font-semibold text-hive-900">{titulo}</h1>
        <p className="mt-3 text-sm text-slate-600">Última atualização: {legalConfig.ultimaAtualizacao}</p>
        <p className="mt-6 rounded-card bg-white p-5 leading-relaxed text-slate-700 shadow-app">{resumo}</p>
        <article className="legal mt-10">{children}</article>
      </main>

      <footer className="border-t border-border bg-white/70">
        <div className="mx-auto max-w-3xl px-4 py-6 text-sm text-slate-600 sm:px-6">© {new Date().getFullYear()} Smart Hive</div>
      </footer>
    </div>
  );
}

export function Contato() {
  return (
    <a href={`mailto:${legalConfig.emailContato}`} className="font-semibold text-hive-700 underline-offset-4 hover:underline">
      {legalConfig.emailContato}
    </a>
  );
}

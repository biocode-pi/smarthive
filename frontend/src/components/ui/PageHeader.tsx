import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface PageHeaderProps {
  title: ReactNode;
  /** Linha de leitura com dados reais da tela (contagens, datas), em fonte de instrumento. */
  leitura?: ReactNode;
  voltar?: { to: string; label: string };
  children?: ReactNode;
}

export function PageHeader({ title, leitura, voltar, children }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-5 border-b border-ink/15 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {voltar ? (
          <Link to={voltar.to} className="press focus-ring mb-3 inline-flex items-center gap-1.5 rounded text-sm font-bold text-ink/70 hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {voltar.label}
          </Link>
        ) : null}
        <h1 className="titulo-pagina">{title}</h1>
        {leitura ? <p className="mt-3 font-dados text-sm text-ink/70">{leitura}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </header>
  );
}

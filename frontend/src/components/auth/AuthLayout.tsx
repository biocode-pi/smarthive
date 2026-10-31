import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { AuthFooterConfig } from "../../config/auth.config";
import { Marca } from "../ui/Marca";

interface AuthLayoutProps {
  footer?: AuthFooterConfig;
  /** Marca grande no topo da coluna (tela de entrada). */
  comMarca?: boolean;
  children: ReactNode;
}

/**
 * Telas de autenticacao. A identidade vem do app mobile (amarelo, marca, campos), mas o
 * layout e de web: no computador, painel da marca a esquerda e formulario a direita;
 * no celular, coluna unica como no app.
 */
export function AuthLayout({ footer, comMarca = true, children }: AuthLayoutProps) {
  return (
    <main className="grid min-h-screen bg-honey-500 text-ink lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden p-14 lg:flex">
        <Link to="/" className="focus-ring w-fit rounded-card" aria-label="Smart Hive, página inicial">
          <Marca comTagline />
        </Link>
        <div className="max-w-md">
          <p className="font-tagline text-xs font-semibold uppercase tracking-[4px]">Meliponicultura</p>
          <p className="mt-4 text-5xl font-black leading-[1.05]">Cada colmeia do meliponário, acompanhada de perto.</p>
          <p className="mt-5 text-lg text-ink/80">A mesma conta vale no site e no aplicativo do celular.</p>
        </div>
        <p className="text-sm font-bold">Projeto Integrador · Fatec Registro</p>
      </aside>

      <section className="flex min-h-screen flex-col px-6 py-10 lg:bg-honey-50 lg:px-16">
        <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center">
          {comMarca ? (
            <Link to="/" className="focus-ring mx-auto mb-10 rounded-card lg:hidden" aria-label="Smart Hive, página inicial">
              <Marca variante="pilha" comTagline />
            </Link>
          ) : null}
          {children}
        </div>

        {footer ? (
          <footer className="mx-auto mt-10 flex w-full max-w-[380px] flex-col items-center gap-2 text-xs font-bold sm:flex-row sm:justify-between">
            <p>{footer.copyright}</p>
            <div className="flex gap-5">
              {footer.links.map((link) => (
                <Link key={link.label} to={link.href} className="focus-ring rounded underline-offset-4 hover:underline">
                  {link.label}
                </Link>
              ))}
            </div>
          </footer>
        ) : null}
      </section>
    </main>
  );
}

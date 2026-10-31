import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { AuthBrandConfig, AuthFooterConfig, AuthQuoteConfig } from "../../config/auth.config";
import { FavoMap, type CelulaFavo } from "../ui/FavoMap";

// Favo ilustrativo do painel lateral (decorativo).
const favoIlustrativo: CelulaFavo[] = [
  { id: "1", codigo: "JAT-001", nome: "Jataí", status: "ativa" },
  { id: "2", codigo: "URU-004", nome: "Uruçu", status: "ativa" },
  { id: "3", codigo: "MAN-003", nome: "Mandaçaia", status: "observacao" },
  { id: "4", codigo: "IRA-006", nome: "Iraí", status: "ativa" },
  { id: "5", codigo: "JAT-002", nome: "Jataí", status: "ativa" },
  { id: "6", codigo: "TUB-007", nome: "Tubuna", status: "ativa" },
  { id: "7", codigo: "MIR-005", nome: "Mirim", status: "ativa" },
];

interface AuthLayoutProps {
  brand: AuthBrandConfig;
  quote: AuthQuoteConfig;
  footer?: AuthFooterConfig;
  children: ReactNode;
}

export function AuthLayout({ brand, quote, footer, children }: AuthLayoutProps) {
  return (
    <main className="grid min-h-screen grid-cols-1 bg-white lg:grid-cols-2">
      <section className="flex min-h-screen flex-col px-6 py-8 sm:px-12 lg:px-16 xl:px-24">
        <header>
          <Link to="/" className="inline-flex items-center gap-2.5">
            <img src={brand.logoSrc} alt={brand.name} className="h-8 w-8 object-contain" />
            <span className="font-display text-base font-semibold text-ink">{brand.name}</span>
          </Link>
        </header>

        <div className="flex flex-1 items-center">
          <div className="w-full max-w-[380px]">{children}</div>
        </div>

        {footer ? (
          <footer className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>{footer.copyright}</p>
            <div className="flex gap-5">
              {footer.links.map((link) => (
                <Link key={link.label} to={link.href} className="focus-ring rounded transition hover:text-slate-700">
                  {link.label}
                </Link>
              ))}
            </div>
          </footer>
        ) : null}
      </section>

      <aside className="relative hidden bg-hive-900 lg:flex lg:flex-col lg:justify-between lg:p-16 xl:p-20">
        <div aria-hidden="true" className="flex flex-1 items-center justify-center">
          <FavoMap celulas={favoIlustrativo} className="max-w-sm" corDoContorno="#10251b" />
        </div>
        <blockquote className="max-w-md">
          <p className="font-display text-3xl font-medium leading-[1.2] text-white">
            {quote.text}
          </p>
          <footer className="mt-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
            {quote.attribution}
          </footer>
        </blockquote>
      </aside>
    </main>
  );
}

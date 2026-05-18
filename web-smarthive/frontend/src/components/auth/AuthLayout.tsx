import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { AuthBrandConfig, AuthFooterConfig, AuthQuoteConfig } from "../../config/auth.config";

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
            <span className="text-base font-semibold tracking-tight text-slate-900">{brand.name}</span>
          </Link>
        </header>

        <div className="flex flex-1 items-center">
          <div className="w-full max-w-[380px]">{children}</div>
        </div>

        {footer ? (
          <footer className="flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>{footer.copyright}</p>
            <div className="flex gap-5">
              {footer.links.map((link) => (
                <a key={link.label} href={link.href} className="transition hover:text-slate-700">
                  {link.label}
                </a>
              ))}
            </div>
          </footer>
        ) : null}
      </section>

      <aside className="relative hidden bg-hive-900 lg:flex lg:flex-col lg:justify-end lg:p-16 xl:p-20">
        <blockquote className="max-w-md">
          <p className="text-3xl font-medium leading-[1.25] tracking-tight text-white">
            {quote.text}
          </p>
          <footer className="mt-8 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">
            {quote.attribution}
          </footer>
        </blockquote>
      </aside>
    </main>
  );
}

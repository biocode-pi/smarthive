import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { AuthBrandConfig, AuthFooterConfig, AuthPromoConfig } from "../../config/auth.config";
import { AuthScene } from "./AuthScene";

interface AuthLayoutProps {
  brand: AuthBrandConfig;
  promo: AuthPromoConfig;
  footer?: AuthFooterConfig;
  topRight?: ReactNode;
  children: ReactNode;
}

export function AuthLayout({ brand, promo, footer, topRight, children }: AuthLayoutProps) {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="flex min-h-screen flex-col bg-white px-6 py-8 sm:px-10 lg:px-16">
        <header className="flex items-start justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-hive-50 ring-1 ring-hive-100">
              <img src={brand.logoSrc} alt={brand.name} className="h-9 w-9 object-contain" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-slate-950">{brand.name}</p>
              <p className="text-xs font-medium text-slate-500">{brand.tagline}</p>
            </div>
          </Link>
          {topRight ? <div className="text-sm text-slate-600">{topRight}</div> : null}
        </header>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>

        {footer ? (
          <footer className="border-t border-slate-100 pt-4 text-xs text-slate-400">
            <p>{footer.copyright}</p>
            {footer.links.length ? (
              <div className="mt-2 flex flex-wrap gap-4">
                {footer.links.map((link) => (
                  <a key={link.label} href={link.href} className="underline-offset-2 hover:text-slate-700 hover:underline">
                    {link.label}
                  </a>
                ))}
              </div>
            ) : null}
          </footer>
        ) : null}
      </section>

      <aside className="relative hidden overflow-hidden lg:block">
        <AuthScene className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 flex items-center justify-end p-10 xl:p-16">
          <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-panel ring-1 ring-slate-100">
            {promo.eyebrow ? (
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-honey-500">{promo.eyebrow}</p>
            ) : null}
            <h3 className="mt-3 text-2xl font-bold leading-snug text-slate-950">{promo.title}</h3>
            {promo.description ? (
              <p className="mt-4 text-sm leading-6 text-slate-600">{promo.description}</p>
            ) : null}
            {promo.bullets.length ? (
              <ul className="mt-5 space-y-2.5">
                {promo.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-honey-500" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {promo.ctaLabel ? (
              <a
                href={promo.ctaHref}
                className="focus-ring mt-6 inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-600"
              >
                {promo.ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </div>
      </aside>
    </main>
  );
}

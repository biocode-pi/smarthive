import type { ReactNode } from "react";
import { cn } from "../../utils/classNames";

interface SecaoProps {
  titulo: string;
  acao?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Secao({ titulo, acao, children, className }: SecaoProps) {
  return (
    <section className={cn("mt-10 min-w-0", className)}>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="titulo-secao">{titulo}</h2>
        {acao}
      </div>
      {children}
    </section>
  );
}

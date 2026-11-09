import type { ReactNode } from "react";
import { cn } from "../../utils/classNames";

export interface Leitura {
  rotulo: string;
  valor: ReactNode;
  nota?: ReactNode;
  /** Pinta o valor de vermelho quando ha algo a resolver. */
  alerta?: boolean;
}

const colunas: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
};

/** Regua de leituras: numeros em Plex Mono separados por linhas finas, como um painel de medidor. */
export function Leituras({ itens, className }: { itens: Leitura[]; className?: string }) {
  return (
    <dl className={cn("grid gap-px border-y border-ink/15 bg-ink/15", colunas[itens.length] ?? "grid-cols-2", className)}>
      {itens.map((item) => (
        <div key={item.rotulo} className="min-w-0 bg-background px-3 py-4 sm:px-5">
          <dt className="rotulo truncate">{item.rotulo}</dt>
          <dd
            className={cn(
              "tabular mt-2 font-dados text-[1.7rem] font-medium leading-none sm:text-3xl",
              item.alerta ? "text-status-risco-texto" : "text-ink",
            )}
          >
            {item.valor}
          </dd>
          {item.nota ? <dd className="mt-2 text-xs text-ink/65">{item.nota}</dd> : null}
        </div>
      ))}
    </dl>
  );
}

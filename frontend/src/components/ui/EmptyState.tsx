import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  acao?: ReactNode;
}

export function EmptyState({ title, description, acao }: EmptyStateProps) {
  return (
    <div className="rounded-[24px] border-2 border-dashed border-ink/20 px-6 py-8">
      <p className="font-expo text-lg font-bold text-ink [font-stretch:108%]">{title}</p>
      <p className="mt-1 max-w-lg text-sm leading-relaxed text-ink/70">{description}</p>
      {acao ? <div className="mt-5">{acao}</div> : null}
    </div>
  );
}

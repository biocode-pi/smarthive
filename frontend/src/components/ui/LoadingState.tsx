import { Hexa } from "./StatusBadge";

export function LoadingState({ label = "Carregando" }: { label?: string }) {
  return (
    <div role="status" className="flex min-h-48 items-center justify-center gap-2.5 font-dados text-sm text-ink/60">
      <Hexa status="observacao" className="h-4 w-4 animate-pulse" />
      {label}…
    </div>
  );
}

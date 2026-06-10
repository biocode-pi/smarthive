export function LoadingState({ label = "Carregando dados do SmartHive..." }: { label?: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-xl border border-white/80 bg-white/80">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-hive-600 border-t-transparent" />
      <span className="ml-3 text-sm font-medium text-slate-600">{label}</span>
    </div>
  );
}


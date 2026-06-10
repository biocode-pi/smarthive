import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon: ReactNode;
}

export function StatCard({ label, value, description, icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-white/80 bg-white/90 p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
        </div>
        <div className="rounded-lg bg-hive-50 p-3 text-hive-700">{icon}</div>
      </div>
      {description ? <p className="mt-4 text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}


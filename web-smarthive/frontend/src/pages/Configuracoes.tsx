import { Camera, Database, Lock, Smartphone } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { API_BASE_URL } from "../services/api";

const settings = [
  {
    title: "API",
    value: API_BASE_URL,
    icon: Database,
  },
  {
    title: "Camera mobile",
    value: "HTTPS ou localhost",
    icon: Smartphone,
  },
  {
    title: "Deteccao",
    value: "Visao local com circulos",
    icon: Camera,
  },
  {
    title: "Dados",
    value: "Supabase PostgreSQL",
    icon: Lock,
  },
];

export function Configuracoes() {
  return (
    <>
      <PageHeader
        title="Configuracoes"
        description="Parametros tecnicos usados pelo SmartHive local."
      />

      <section className="grid gap-4 md:grid-cols-2">
        {settings.map((item) => (
          <div key={item.title} className="surface rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-hive-50 p-3 text-hive-700">
                <item.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-500">{item.title}</p>
                <p className="mt-2 break-words text-lg font-bold text-slate-950">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

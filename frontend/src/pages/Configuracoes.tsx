import { Camera, Database, Lock, LogOut, Smartphone, UserCircle } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { useAuth, userDisplayName } from "../context/AuthContext";
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
  const { logout, user } = useAuth();

  return (
    <>
      <PageHeader
        title="Configuracoes"
        description="Conta, sessao e parametros tecnicos usados pelo SmartHive."
      />

      <section className="surface mb-6 rounded-xl p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="rounded-lg bg-hive-50 p-3 text-hive-700">
              <UserCircle className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-500">Conta conectada</p>
              <p className="mt-1 truncate text-lg font-bold text-slate-950">{userDisplayName(user)}</p>
              <p className="truncate text-sm text-slate-600">{user?.email}</p>
            </div>
          </div>
          <Button variant="secondary" icon={<LogOut className="h-4 w-4" />} onClick={logout}>
            Sair
          </Button>
        </div>
      </section>

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

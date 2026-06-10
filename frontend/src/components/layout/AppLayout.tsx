import {
  BarChart3,
  Bell,
  Camera,
  FileText,
  Flower2,
  Home,
  LogOut,
  Menu,
  Settings,
  UserCircle,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { useAuth, userDisplayName } from "../../context/AuthContext";
import { cn } from "../../utils/classNames";

const navItems = [
  { to: "/", label: "Visao geral", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/colmeias", label: "Colmeias", icon: Flower2 },
  { to: "/sensor-celular", label: "Camera IA", icon: Camera },
  { to: "/registros", label: "Historico", icon: FileText },
  { to: "/alertas", label: "Alertas", icon: Bell },
  { to: "/configuracoes", label: "Configuracoes", icon: Settings },
];

function Navigation({ onNavigate, compact = false }: { onNavigate?: () => void; compact?: boolean }) {
  return (
    <nav className={cn("gap-2", compact ? "flex overflow-x-auto px-4 pb-3" : "flex flex-col")}>
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "focus-ring inline-flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition",
              compact && "whitespace-nowrap",
              isActive
                ? "bg-hive-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-hive-50 hover:text-slate-950",
            )
          }
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-hive-100">
        <img src={logo} alt="SmartHive" className="h-9 w-9 object-contain" />
      </div>
      <div>
        <p className="text-lg font-bold tracking-tight text-slate-950">Smart Hive</p>
        <p className="text-xs font-medium text-slate-500">Gestao apicola inteligente</p>
      </div>
    </div>
  );
}

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-sidebar-border bg-white/80 px-5 py-6 shadow-sm backdrop-blur-xl lg:block">
        <Brand />

        <div className="mt-8 space-y-6">
          <div>
            <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">Principal</p>
            <Navigation />
          </div>
        </div>

        <div className="absolute bottom-6 left-5 right-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
            <UserCircle className="h-8 w-8 flex-shrink-0 text-hive-700" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-950">{userDisplayName(user)}</p>
              <p className="truncate text-xs font-medium text-slate-600">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/90 shadow-sm backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Brand />
          <button
            type="button"
            className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700"
            onClick={() => setOpen((value) => !value)}
            aria-label="Abrir navegacao"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open ? (
          <div className="border-t border-slate-100 bg-white/95 px-4 py-3">
            <Navigation onNavigate={() => setOpen(false)} />
            <div className="mt-3 flex items-center justify-between rounded-lg bg-hive-50 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-950">{userDisplayName(user)}</p>
                <p className="truncate text-xs text-slate-600">{user?.email}</p>
              </div>
              <button
                type="button"
                className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-700"
                onClick={handleLogout}
                aria-label="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <Navigation compact />
        )}
      </header>

      <main className="px-4 py-6 sm:px-6 lg:ml-72 lg:px-10 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}

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
  { to: "/app", label: "Visão geral", icon: Home },
  { to: "/app/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/app/colmeias", label: "Colmeias", icon: Flower2 },
  { to: "/app/sensor-celular", label: "Câmera IA", icon: Camera },
  { to: "/app/registros", label: "Histórico", icon: FileText },
  { to: "/app/alertas", label: "Alertas", icon: Bell },
  { to: "/app/configuracoes", label: "Configurações", icon: Settings },
];

// Barra inferior do celular: as telas de uso diario no campo. O resto fica no menu.
const tabItems = [
  { to: "/app", label: "Início", icon: Home },
  { to: "/app/colmeias", label: "Colmeias", icon: Flower2 },
  { to: "/app/sensor-celular", label: "Câmera", icon: Camera },
  { to: "/app/alertas", label: "Alertas", icon: Bell },
];

function BottomTabs({ onMenu, menuAberto }: { onMenu: () => void; menuAberto: boolean }) {
  const itemClass =
    "focus-ring flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-semibold";
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      aria-label="Navegação principal"
    >
      <div className="flex">
        {tabItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/app"}
            className={({ isActive }) => cn(itemClass, isActive ? "text-hive-700" : "text-slate-600")}
          >
            {({ isActive }) => (
              <>
                <span className={cn("rounded-full px-4 py-1", isActive && "bg-hive-100")}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
        <button
          type="button"
          className={cn(itemClass, menuAberto ? "text-hive-700" : "text-slate-600")}
          onClick={onMenu}
          aria-expanded={menuAberto}
        >
          <span className={cn("rounded-full px-4 py-1", menuAberto && "bg-hive-100")}>
            <Menu className="h-5 w-5" aria-hidden="true" />
          </span>
          Menu
        </button>
      </div>
    </nav>
  );
}

function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-2">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/app"}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "focus-ring inline-flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition",
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
        <p className="font-display text-lg font-semibold text-ink">SmartHive</p>
        <p className="text-xs font-medium text-slate-500">Meliponicultura inteligente</p>
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
            <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-slate-500">Principal</p>
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
            aria-label="Abrir navegação"
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
        ) : null}
      </header>

      <main className="px-4 pb-28 pt-6 sm:px-6 lg:ml-72 lg:px-10 lg:py-8">
        <Outlet />
      </main>

      <BottomTabs onMenu={() => setOpen((value) => !value)} menuAberto={open} />
    </div>
  );
}

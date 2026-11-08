import { Archive, Bell, Camera, Home, LogOut, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Marca } from "../ui/Marca";
import { Sheet } from "../ui/Sheet";
import { useAuth, userDisplayName } from "../../context/AuthContext";
import { cn } from "../../utils/classNames";

// Dois grupos: o que existe no campo e o que foi medido nele.
const navGrupos = [
  [
    { to: "/app", label: "Visão geral" },
    { to: "/app/meliponarios", label: "Meliponários" },
    { to: "/app/colmeias", label: "Colmeias" },
    { to: "/app/sensor-celular", label: "Captura" },
  ],
  [
    { to: "/app/dashboard", label: "Atividade" },
    { to: "/app/registros", label: "Histórico" },
    { to: "/app/alertas", label: "Alertas" },
    { to: "/app/configuracoes", label: "Configurações" },
  ],
];

// Barra inferior do celular: as telas de uso diario no campo. O resto fica no menu.
const tabItems = [
  { to: "/app", label: "Início", icon: Home },
  { to: "/app/meliponarios", label: "Meliponários", icon: Archive },
  { to: "/app/sensor-celular", label: "Captura", icon: Camera },
  { to: "/app/alertas", label: "Alertas", icon: Bell },
];

function BottomTabs({ onMenu, menuAberto }: { onMenu: () => void; menuAberto: boolean }) {
  const itemClass =
    "press focus-ring flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-semibold";
  return (
    <nav
      className="material-branco fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 px-2 pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Navegação principal"
    >
      <div className="flex">
        {tabItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/app"}
            className={({ isActive }) => cn(itemClass, isActive ? "text-ink" : "text-ink/55")}
          >
            {({ isActive }) => (
              <>
                <span className={cn("rounded-full px-4 py-1 transition-colors duration-200", isActive && "bg-honey-500")}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
        <button
          type="button"
          className={cn(itemClass, menuAberto ? "text-ink" : "text-ink/55")}
          onClick={onMenu}
          aria-expanded={menuAberto}
        >
          <span className={cn("rounded-full px-4 py-1 transition-colors duration-200", menuAberto && "bg-honey-500")}>
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
    <nav className="flex flex-col">
      {navGrupos.map((grupo, indice) => (
        <div key={indice} className={cn("flex flex-col gap-0.5", indice > 0 && "mt-3 border-t border-ink/15 pt-3")}>
          {grupo.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/app"}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "press focus-ring flex min-h-11 items-center rounded-full px-4 font-expo text-[15px] font-bold [font-stretch:106%]",
                  isActive ? "bg-ink text-honey-500" : "text-ink hover:bg-ink/10",
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Marca comTagline />
  );
}

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // O menu em painel so existe no celular; ao alargar a janela, a barra lateral assume.
  useEffect(() => {
    const largo = window.matchMedia("(min-width: 1024px)");
    const aoMudar = () => largo.matches && setOpen(false);
    largo.addEventListener("change", aoMudar);
    return () => largo.removeEventListener("change", aoMudar);
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-honey-500 px-4 py-6 lg:flex">
        <div className="px-2">
          <Brand />
        </div>

        <div className="mt-10 flex-1 overflow-y-auto">
          <Navigation />
        </div>

        <div className="mt-6 border-t border-ink/15 px-2 pt-4">
          <p className="truncate text-sm font-bold text-ink">{userDisplayName(user)}</p>
          <p className="truncate font-dados text-xs text-ink/65">{user?.email}</p>
          <button
            type="button"
            className="press focus-ring mt-3 inline-flex items-center gap-2 rounded text-sm font-bold text-ink/75 hover:text-ink"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sair
          </button>
        </div>
      </aside>

      <header className="material-mel sticky top-0 z-40 lg:hidden">
        <div className="flex items-center px-4 py-3">
          <Brand />
        </div>
      </header>

      <main className="px-4 pb-28 pt-6 sm:px-6 lg:ml-64 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>

      <BottomTabs onMenu={() => setOpen((value) => !value)} menuAberto={open} />

      {/* No celular o menu completo sobe da aba "Menu", de onde foi chamado. */}
      <Sheet aberto={open} onFechar={() => setOpen(false)} titulo="Menu" className="lg:hidden">
        <Navigation onNavigate={() => setOpen(false)} />
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink/15 pt-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">{userDisplayName(user)}</p>
            <p className="truncate font-dados text-xs text-ink/65">{user?.email}</p>
          </div>
          <button
            type="button"
            className="press focus-ring inline-flex min-h-10 flex-shrink-0 items-center gap-2 rounded-full border border-ink/20 bg-white px-4 text-sm font-bold text-ink"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" /> Sair
          </button>
        </div>
      </Sheet>
    </div>
  );
}

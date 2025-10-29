import { NavLink, useNavigate } from "react-router-dom";
import { 
  Home, 
  BarChart3, 
  MapPin, 
  Flower2, 
  FileText, 
  PlusCircle,
  Bell,
  Settings,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const menuSections = [
  {
    title: "Principal",
    items: [
      { title: "Visão Geral", url: "/", icon: Home },
      { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
    ]
  },
  {
    title: "Gestão",
    items: [
      { title: "Apiários", url: "/apiarios", icon: MapPin },
      { title: "Colmeias", url: "/colmeias", icon: Flower2 },
    ]
  },
  {
    title: "Registros",
    items: [
      { title: "Novo Registro", url: "/registros/novo", icon: PlusCircle },
      { title: "Histórico", url: "/registros", icon: FileText },
    ]
  },
  {
    title: "Sistema",
    items: [
      { title: "Alertas", url: "/alertas", icon: Bell },
      { title: "Configurações", url: "/configuracoes", icon: Settings },
    ]
  }
];

export function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <aside className="w-72 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col shadow-sm">
      <div className="p-6 border-b border-sidebar-border flex items-center gap-3">
        <img src={logo} alt="Smart Hive" className="w-10 h-10" />
        <div>
          <h1 className="text-xl font-bold text-sidebar-primary tracking-tight">Smart Hive</h1>
          <p className="text-xs text-muted-foreground">Gestão Apícola</p>
        </div>
      </div>

      <nav className="flex-1 p-6 space-y-6 overflow-y-auto">
        {menuSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-4">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.url}
                  to={item.url}
                  end={item.url === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:translate-x-1"
                    }`
                  }
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">{item.title}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-6 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          <span className="text-sm">Sair</span>
        </Button>
      </div>
    </aside>
  );
}

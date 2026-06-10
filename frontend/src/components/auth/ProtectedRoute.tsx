import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function ProtectedRoute() {
  const { carregando, user } = useAuth();
  const location = useLocation();

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="surface rounded-xl p-6 text-center">
          <p className="text-sm font-semibold text-slate-500">Verificando sessao</p>
          <p className="mt-2 text-lg font-bold text-slate-950">SmartHive</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { carregando, recuperandoSenha, user } = useAuth();
  const location = useLocation();
  const redirectTo = (location.state as { from?: { pathname?: string } })?.from?.pathname ?? "/";

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="surface rounded-xl p-6 text-center">
          <p className="text-sm font-semibold text-slate-500">Preparando login</p>
          <p className="mt-2 text-lg font-bold text-slate-950">SmartHive</p>
        </div>
      </div>
    );
  }

  if (user && !recuperandoSenha) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}

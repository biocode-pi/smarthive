import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function ProtectedRoute() {
  const { carregando, user } = useAuth();
  const location = useLocation();

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="surface p-6 text-center">
          <p className="rotulo">Verificando sessão</p>
          <p className="mt-2 font-expo text-xl font-extrabold text-ink [font-stretch:112%]">Smart Hive</p>
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
  const { carregando, user } = useAuth();
  const location = useLocation();
  const redirectTo = (location.state as { from?: { pathname?: string } })?.from?.pathname ?? "/app";

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="surface p-6 text-center">
          <p className="rotulo">Preparando login</p>
          <p className="mt-2 font-expo text-xl font-extrabold text-ink [font-stretch:112%]">Smart Hive</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}

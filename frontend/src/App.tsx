import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute } from "./components/auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider } from "./context/AuthContext";

const Alertas = lazy(() => import("./pages/Alertas").then(({ Alertas }) => ({ default: Alertas })));
const ColmeiaDetalhes = lazy(() =>
  import("./pages/ColmeiaDetalhes").then(({ ColmeiaDetalhes }) => ({ default: ColmeiaDetalhes })),
);
const Colmeias = lazy(() => import("./pages/Colmeias").then(({ Colmeias }) => ({ default: Colmeias })));
const Configuracoes = lazy(() =>
  import("./pages/Configuracoes").then(({ Configuracoes }) => ({ default: Configuracoes })),
);
const Dashboard = lazy(() => import("./pages/Dashboard").then(({ Dashboard }) => ({ default: Dashboard })));
const Login = lazy(() => import("./pages/Login").then(({ Login }) => ({ default: Login })));
const NotFound = lazy(() => import("./pages/NotFound").then(({ NotFound }) => ({ default: NotFound })));
const Overview = lazy(() => import("./pages/Overview").then(({ Overview }) => ({ default: Overview })));
const Registros = lazy(() => import("./pages/Registros").then(({ Registros }) => ({ default: Registros })));
const SensorCelular = lazy(() =>
  import("./pages/SensorCelular").then(({ SensorCelular }) => ({ default: SensorCelular })),
);

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="surface rounded-xl p-6 text-center">
        <p className="text-sm font-semibold text-slate-500">Carregando</p>
        <p className="mt-2 text-lg font-bold text-slate-950">SmartHive</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<PublicOnlyRoute />}>
              <Route path="login" element={<Login />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Overview />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="colmeias" element={<Colmeias />} />
                <Route path="colmeias/:id" element={<ColmeiaDetalhes />} />
                <Route path="colmeias/:id/monitoramentos/novo" element={<Navigate to="/sensor-celular" replace />} />
                <Route path="monitoramentos/novo" element={<Navigate to="/sensor-celular" replace />} />
                <Route path="registros" element={<Registros />} />
                <Route path="sensor-celular" element={<SensorCelular />} />
                <Route path="alertas" element={<Alertas />} />
                <Route path="configuracoes" element={<Configuracoes />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute, PublicOnlyRoute } from "./components/auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider } from "./context/AuthContext";
import { Alertas } from "./pages/Alertas";
import { ColmeiaDetalhes } from "./pages/ColmeiaDetalhes";
import { Colmeias } from "./pages/Colmeias";
import { Configuracoes } from "./pages/Configuracoes";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { NotFound } from "./pages/NotFound";
import { Overview } from "./pages/Overview";
import { Registros } from "./pages/Registros";
import { SensorCelular } from "./pages/SensorCelular";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AuthProvider>
  );
}

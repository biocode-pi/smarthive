import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { Alertas } from "./pages/Alertas";
import { ColmeiaDetalhes } from "./pages/ColmeiaDetalhes";
import { Colmeias } from "./pages/Colmeias";
import { Configuracoes } from "./pages/Configuracoes";
import { Dashboard } from "./pages/Dashboard";
import { NotFound } from "./pages/NotFound";
import { NovoMonitoramento } from "./pages/NovoMonitoramento";
import { Overview } from "./pages/Overview";
import { Registros } from "./pages/Registros";
import { SensorCelular } from "./pages/SensorCelular";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Overview />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="colmeias" element={<Colmeias />} />
          <Route path="colmeias/:id" element={<ColmeiaDetalhes />} />
          <Route path="colmeias/:id/monitoramentos/novo" element={<NovoMonitoramento />} />
          <Route path="monitoramentos/novo" element={<NovoMonitoramento />} />
          <Route path="registros" element={<Registros />} />
          <Route path="sensor-celular" element={<SensorCelular />} />
          <Route path="alertas" element={<Alertas />} />
          <Route path="configuracoes" element={<Configuracoes />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

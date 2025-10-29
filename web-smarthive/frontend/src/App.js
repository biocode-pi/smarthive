import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import GraphDashboard from './pages/GraphDashboard';
import CadastroMonitoramento from './pages/CadastroMonitoramento';
import ListaMonitoramento from './pages/ListaMonitoramento';
import ListaColmeias from './pages/ListaColmeias';
import CadastroColmeia from './pages/CadastroColmeia';
import DetalheColmeia from './pages/DetalheColmeia';
import ListaAlertas from './pages/ListaAlertas';
import Configuracoes from './pages/Configuracoes';
import Login from './pages/Login';
import ListaApiarios from './pages/ListaApiarios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('isAuthenticated') === 'true');
  
  const handleLogin = () => {
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      {!isAuthenticated ? (
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <div className="app-container">
          <Navbar onLogout={handleLogout} />
          <div className="page-content">
            <div className="container-fluid p-4">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/grafico-dashboard" element={<GraphDashboard />} />
                <Route path="/apiarios" element={<ListaApiarios />} />
                <Route path="/cadastro" element={<CadastroMonitoramento />} />
                <Route path="/lista" element={<ListaMonitoramento />} />
                <Route path="/colmeias" element={<ListaColmeias />} />
                <Route path="/colmeias/:id" element={<DetalheColmeia />} />
                <Route path="/colmeias/editar/:id" element={<CadastroColmeia />} />
                <Route path="/colmeias/novo" element={<CadastroColmeia />} />
                <Route path="/alertas" element={<ListaAlertas />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </div>
        </div>
      )}
    </Router>
  );
}

export default App;


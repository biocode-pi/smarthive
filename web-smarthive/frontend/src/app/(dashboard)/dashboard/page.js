'use client';

import { useState, useEffect } from 'react';
import { Row, Col, Card, Alert, Badge, Spinner } from 'react-bootstrap';
import Link from 'next/link';
import api from '@/lib/api';
import DashboardCharts from '@/components/DashboardCharts';

export default function DashboardPage() {
  const [colmeias, setColmeias] = useState([]);
  const [monitoramentos, setMonitoramentos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [apiarios, setApiarios] = useState([]);

  useEffect(() => {
    fetchData();

    const intervalId = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchData = async () => {
    try {
      const [colmeiasRes, monitoramentosRes, alertasRes, apiariosRes] = await Promise.all([
        api.get('/colmeias'),
        api.get('/monitoramento?limit=10'),
        api.get('/alertas'),
        api.get('/apiarios')
      ]);

      setColmeias(colmeiasRes.data);
      setMonitoramentos(monitoramentosRes.data);
      setAlertas(alertasRes.data);
      setApiarios(apiariosRes.data);
      setError('');
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setError('Erro ao carregar dados do dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('pt-BR');
  };

  const getStatusColor = (status) => {
    if (!status) return 'secondary';

    switch (status.toLowerCase()) {
      case 'normal':
        return 'success';
      case 'alerta':
        return 'warning';
      case 'crítico':
        return 'danger';
      case 'em observação':
        return 'info';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Carregando...</span>
        </Spinner>
        <p className="mt-2">Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="main-title d-flex align-items-center">
          <div className="me-3 p-2 rounded-circle bg-primary-light d-inline-flex align-items-center justify-content-center">
            <i className="fas fa-chart-pie text-primary"></i>
          </div>
          Dashboard
        </h1>
        <p className="text-muted mb-0">Monitoramento em tempo real de suas colmeias</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-3 mb-4">
        <Col lg={3} sm={6}>
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-icon">
                <i className="fas fa-home"></i>
              </div>
              <div className="stat-label">Total de Colmeias</div>
              <div className="stat-value">{colmeias.length}</div>
              <Link href="/colmeias" className="btn btn-sm btn-link text-primary p-0">
                Ver Detalhes <i className="fas fa-arrow-right ms-1"></i>
              </Link>
            </div>
          </div>
        </Col>

        <Col lg={3} sm={6}>
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-icon">
                <i className="fas fa-clipboard-list"></i>
              </div>
              <div className="stat-label">Monitoramentos</div>
              <div className="stat-value">{monitoramentos.length}</div>
              <Link href="/lista" className="btn btn-sm btn-link text-primary p-0">
                Ver Detalhes <i className="fas fa-arrow-right ms-1"></i>
              </Link>
            </div>
          </div>
        </Col>

        <Col lg={3} sm={6}>
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-icon">
                <i className="fas fa-bell"></i>
              </div>
              <div className="stat-label">Alertas</div>
              <div className="stat-value">{alertas.length}</div>
              <Link href="/alertas" className="btn btn-sm btn-link text-primary p-0">
                Ver Detalhes <i className="fas fa-arrow-right ms-1"></i>
              </Link>
            </div>
          </div>
        </Col>

        <Col lg={3} sm={6}>
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-icon">
                <i className="fas fa-leaf"></i>
              </div>
              <div className="stat-label">Apiários</div>
              <div className="stat-value">{apiarios.length}</div>
              <Link href="/apiarios" className="btn btn-sm btn-link text-primary p-0">
                Ver Detalhes <i className="fas fa-arrow-right ms-1"></i>
              </Link>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white d-flex align-items-center">
              <div className="me-2 rounded-circle bg-primary-light p-2 d-flex align-items-center justify-content-center">
                <i className="fas fa-chart-bar text-primary"></i>
              </div>
              <h5 className="mb-0 fw-semibold">Gráficos de Desempenho</h5>
            </Card.Header>
            <Card.Body>
              <DashboardCharts />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3">
        <Col lg={6} xl={7} className="mb-4">
          <Card className="shadow-sm border-0 h-100">
            <Card.Header className="bg-white d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <div className="me-2 rounded-circle bg-warning-light p-2 d-flex align-items-center justify-content-center">
                  <i className="fas fa-bell text-warning"></i>
                </div>
                <h5 className="mb-0 fw-semibold">Alertas Recentes</h5>
              </div>
              <Badge bg="danger" pill className="px-3 py-2">{alertas.length}</Badge>
            </Card.Header>
            <Card.Body className="p-0">
              {alertas.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-3">
                    <i className="fas fa-check-circle fa-3x text-success opacity-50"></i>
                  </div>
                  <p className="text-muted">Nenhum alerta registrado.</p>
                </div>
              ) : (
                <div className="p-3 alert-list">
                  {alertas.slice(0, 5).map((alerta, index) => (
                    <div key={index} className="alert-item">
                      <div className="d-flex w-100 justify-content-between align-items-start">
                        <div>
                          <div className="alert-colmeia">
                            <i className="fas fa-hive me-2 text-primary"></i>
                            {alerta.nome_colmeia || `Colmeia #${alerta.colmeia_id}`}
                          </div>
                          <p className="alert-date small text-muted mb-1">
                            <i className="far fa-clock me-1"></i>
                            {formatDateTime(alerta.data_hora)}
                          </p>
                          <p className="alert-description mb-0 text-dark">{alerta.descricao_alerta}</p>
                        </div>
                        <Badge
                          bg={alerta.descricao_alerta.toLowerCase().includes('predador') ? 'danger' : 'warning'}
                          className="ms-2 mt-1 rounded-pill px-3"
                        >
                          {alerta.descricao_alerta.toLowerCase().includes('predador') ? 'Predador' : 'Alerta'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
            <Card.Footer className="text-center bg-white">
              <Link href="/alertas" className="btn btn-sm btn-primary px-4 rounded-pill">
                Ver Todos os Alertas <i className="fas fa-arrow-right ms-1"></i>
              </Link>
            </Card.Footer>
          </Card>
        </Col>

        <Col lg={6} xl={5} className="mb-4">
          <Card className="shadow-sm border-0 h-100">
            <Card.Header className="bg-white d-flex align-items-center">
              <div className="me-2 rounded-circle bg-primary-light p-2 d-flex align-items-center justify-content-center">
                <i className="fas fa-clipboard-list text-primary"></i>
              </div>
              <h5 className="mb-0 fw-semibold">Últimos Monitoramentos</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {monitoramentos.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-3">
                    <i className="fas fa-clipboard fa-3x text-muted opacity-50"></i>
                  </div>
                  <p className="text-muted">Nenhum monitoramento registrado.</p>
                </div>
              ) : (
                <div className="p-3 monitoring-list">
                  {monitoramentos.slice(0, 5).map((monitoramento, index) => (
                    <div key={index} className="monitoring-item">
                      <div className="d-flex w-100 justify-content-between align-items-start">
                        <div className="monitoring-content">
                          <div className="monitoring-colmeia fw-semibold">
                            <i className="fas fa-hive me-2 text-primary"></i>
                            {monitoramento.nome_colmeia || `Colmeia #${monitoramento.colmeia_id}`}
                          </div>
                          <p className="monitoring-date small text-muted mb-1">
                            <i className="far fa-clock me-1"></i>
                            {formatDateTime(monitoramento.data_hora)}
                          </p>
                          <div className="monitoring-details">
                            <span className="btn btn-sm btn-light me-1 mb-1">
                              <i className="fas fa-bug me-1 text-primary"></i>
                              {monitoramento.numero_abelhas}
                            </span>
                            <span className="btn btn-sm btn-light me-1 mb-1">
                              <i className="fas fa-thermometer-half me-1 text-danger"></i>
                              {monitoramento.temperatura}°C
                            </span>
                            <span className="btn btn-sm btn-light mb-1">
                              <i className="fas fa-cloud me-1 text-info"></i>
                              {monitoramento.clima}
                            </span>
                          </div>
                        </div>
                        <Badge
                          bg={getStatusColor(monitoramento.situacao)}
                          className="ms-2 mt-1 rounded-pill px-3"
                        >
                          {monitoramento.situacao}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
            <Card.Footer className="text-center bg-white">
              <Link href="/lista" className="btn btn-sm btn-primary px-4 rounded-pill">
                Ver Todos os Monitoramentos <i className="fas fa-arrow-right ms-1"></i>
              </Link>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="shadow-sm border-0 text-center">
            <Card.Body className="py-5">
              <div className="mb-4">
                <div className="d-inline-flex align-items-center justify-content-center bg-primary-light p-3 rounded-circle mb-3">
                  <i className="fas fa-chart-line fa-3x text-primary opacity-75"></i>
                </div>
                <h3 className="mb-3 fw-bold">Análise Detalhada de Dados</h3>
                <p className="text-muted mb-4 mx-auto" style={{ maxWidth: "600px" }}>
                  Explore análises profundas e tendências com visualizações interativas da saúde de suas colmeias,
                  métricas de produtividade e monitoramento ambiental.
                </p>
                <Link href="/grafico-dashboard" className="btn btn-primary px-4 py-2 rounded-pill">
                  <i className="fas fa-chart-bar me-2"></i>
                  Acessar Dashboard Analítico
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
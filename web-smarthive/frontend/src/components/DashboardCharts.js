'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spinner } from 'react-bootstrap';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  PieController,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import api from '@/lib/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  PieController,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardCharts() {
  const [monitoramentos, setMonitoramentos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [monitoramentosRes, alertasRes] = await Promise.all([
          api.get('/monitoramento'),
          api.get('/alertas')
        ]);

        setMonitoramentos(monitoramentosRes.data);
        setAlertas(alertasRes.data);
        setError('');
      } catch (error) {
        console.error('Erro ao buscar dados para gráficos:', error);
        setError('Erro ao carregar dados dos gráficos.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Prepare data for bee population chart
  const prepareBeePopulationData = () => {
    if (!monitoramentos.length) return null;

    // Group data by date
    const groupedData = monitoramentos.reduce((acc, item) => {
      const date = new Date(item.data_hora);
      const dateStr = date.toLocaleDateString('pt-BR');

      if (!acc[dateStr]) {
        acc[dateStr] = {
          count: 1,
          bees: parseInt(item.numero_abelhas)
        };
      } else {
        acc[dateStr].count++;
        acc[dateStr].bees += parseInt(item.numero_abelhas);
      }

      return acc;
    }, {});

    // Calculate average bees per day
    Object.keys(groupedData).forEach(date => {
      groupedData[date].average = Math.round(groupedData[date].bees / groupedData[date].count);
    });

    // Get last 7 days
    const dateLabels = Object.keys(groupedData).sort((a, b) => {
      return new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-'));
    }).slice(-7);

    return {
      labels: dateLabels,
      datasets: [
        {
          label: 'Média de Abelhas',
          data: dateLabels.map(date => groupedData[date].average),
          borderColor: '#FFC107',
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#FFC107',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#FFC107'
        }
      ]
    };
  };

  // Prepare data for temperature chart
  const prepareTemperatureData = () => {
    if (!monitoramentos.length) return null;

    // Group data by date
    const groupedData = monitoramentos.reduce((acc, item) => {
      const date = new Date(item.data_hora);
      const dateStr = date.toLocaleDateString('pt-BR');

      if (!acc[dateStr]) {
        acc[dateStr] = {
          count: 1,
          temps: [parseFloat(item.temperatura)]
        };
      } else {
        acc[dateStr].count++;
        acc[dateStr].temps.push(parseFloat(item.temperatura));
      }

      return acc;
    }, {});

    // Calculate min, max and avg temperature per day
    Object.keys(groupedData).forEach(date => {
      const temps = groupedData[date].temps;
      groupedData[date].min = Math.min(...temps);
      groupedData[date].max = Math.max(...temps);
      groupedData[date].avg = temps.reduce((a, b) => a + b, 0) / temps.length;
    });

    // Get last 7 days
    const dateLabels = Object.keys(groupedData).sort((a, b) => {
      return new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-'));
    }).slice(-7);

    return {
      labels: dateLabels,
      datasets: [
        {
          label: 'Temperatura Mínima',
          data: dateLabels.map(date => groupedData[date].min.toFixed(1)),
          backgroundColor: 'rgba(66, 165, 245, 0.7)',
          borderWidth: 1
        },
        {
          label: 'Temperatura Média',
          data: dateLabels.map(date => groupedData[date].avg.toFixed(1)),
          backgroundColor: 'rgba(255, 167, 38, 0.7)',
          borderWidth: 1
        },
        {
          label: 'Temperatura Máxima',
          data: dateLabels.map(date => groupedData[date].max.toFixed(1)),
          backgroundColor: 'rgba(239, 83, 80, 0.7)',
          borderWidth: 1
        }
      ]
    };
  };

  // Prepare data for situation distribution
  const prepareSituationData = () => {
    if (!monitoramentos.length) return null;

    // Count occurrences of each situation
    const situacoes = monitoramentos.reduce((acc, item) => {
      if (!acc[item.situacao]) {
        acc[item.situacao] = 1;
      } else {
        acc[item.situacao]++;
      }
      return acc;
    }, {});

    // Colors for different situations
    const backgroundColor = {
      'Normal': 'rgba(76, 175, 80, 0.7)',
      'Alerta': 'rgba(255, 193, 7, 0.7)',
      'Crítico': 'rgba(244, 67, 54, 0.7)',
      'Em observação': 'rgba(33, 150, 243, 0.7)'
    };

    return {
      labels: Object.keys(situacoes),
      datasets: [
        {
          data: Object.values(situacoes),
          backgroundColor: Object.keys(situacoes).map(situacao => 
            backgroundColor[situacao] || 'rgba(158, 158, 158, 0.7)'
          )
        }
      ]
    };
  };

  // Prepare data for alert trends
  const prepareAlertTrendsData = () => {
    if (!alertas.length) return null;

    // Group alerts by date
    const groupedData = alertas.reduce((acc, item) => {
      const date = new Date(item.data_hora);
      const dateStr = date.toLocaleDateString('pt-BR');

      if (!acc[dateStr]) {
        acc[dateStr] = 1;
      } else {
        acc[dateStr]++;
      }
      return acc;
    }, {});

    // Get last 7 days with alerts
    const dateLabels = Object.keys(groupedData).sort((a, b) => {
      return new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-'));
    }).slice(-7);

    return {
      labels: dateLabels,
      datasets: [
        {
          label: 'Número de Alertas',
          data: dateLabels.map(date => groupedData[date]),
          borderColor: '#FFC107',
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#FFC107',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#FFC107'
        }
      ]
    };
  };

  const beePopulationData = prepareBeePopulationData();
  const temperatureData = prepareTemperatureData();
  const situationData = prepareSituationData();
  const alertTrendsData = prepareAlertTrendsData();

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'População de Abelhas (Últimos 7 dias)',
        font: {
          size: 14,
          weight: 600
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#455A64',
        bodyColor: '#455A64',
        borderColor: '#FFD54F',
        borderWidth: 1,
        cornerRadius: 8,
        boxPadding: 6
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Temperatura (°C) - Últimos 7 dias',
        font: {
          size: 14,
          weight: 600
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#455A64',
        bodyColor: '#455A64',
        borderColor: '#FFD54F',
        borderWidth: 1,
        cornerRadius: 8,
        boxPadding: 6
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Distribuição de Situações',
        font: {
          size: 14,
          weight: 600
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#455A64',
        bodyColor: '#455A64',
        borderColor: '#FFD54F',
        borderWidth: 1,
        cornerRadius: 8,
        boxPadding: 6
      }
    }
  };

  const alertChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Tendência de Alertas (Últimos 7 dias)',
        font: {
          size: 14,
          weight: 600
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#455A64',
        bodyColor: '#455A64',
        borderColor: '#FFD54F',
        borderWidth: 1,
        cornerRadius: 8,
        boxPadding: 6
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Carregando...</span>
        </Spinner>
        <p className="mt-2">Carregando gráficos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <i className="fas fa-exclamation-circle me-2"></i>
        {error}
      </div>
    );
  }

  return (
    <Row className="g-3">
      <Col lg={6} className="mb-4">
        <Card className="shadow-sm border-0 h-100">
          <Card.Body className="p-3">
            {beePopulationData ? (
              <Line data={beePopulationData} options={lineChartOptions} height={120} />
            ) : (
              <div className="text-center py-5">
                <p className="text-muted">Sem dados suficientes para gerar o gráfico</p>
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>
      
      <Col lg={6} className="mb-4">
        <Card className="shadow-sm border-0 h-100">
          <Card.Body className="p-3">
            {temperatureData ? (
              <Bar data={temperatureData} options={barChartOptions} height={120} />
            ) : (
              <div className="text-center py-5">
                <p className="text-muted">Sem dados suficientes para gerar o gráfico</p>
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>
      
      <Col lg={6} className="mb-4">
        <Card className="shadow-sm border-0 h-100">
          <Card.Body className="p-3">
            {situationData ? (
              <Doughnut data={situationData} options={pieChartOptions} height={150} />
            ) : (
              <div className="text-center py-5">
                <p className="text-muted">Sem dados suficientes para gerar o gráfico</p>
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>
      
      <Col lg={6} className="mb-4">
        <Card className="shadow-sm border-0 h-100">
          <Card.Body className="p-3">
            {alertTrendsData ? (
              <Bar data={alertTrendsData} options={alertChartOptions} height={150} />
            ) : (
              <div className="text-center py-5">
                <p className="text-muted">Sem dados suficientes para gerar o gráfico</p>
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}
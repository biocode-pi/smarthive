import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spinner, Alert, Badge, Form, Button } from 'react-bootstrap';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import api from '../services/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
);

const GraphDashboard = () => {
  const [monitoramentos, setMonitoramentos] = useState([]);
  const [colmeias, setColmeias] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [predatorAlerts, setPredatorAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seasons, setSeasons] = useState([]);
  const [healthStatus, setHealthStatus] = useState({
    overall: 'Normal',
    score: 85,
    factors: []
  });
  const [apiarios, setApiarios] = useState([]);
  const [selectedApiario, setSelectedApiario] = useState('');
  const [selectedApiarioName, setSelectedApiarioName] = useState('Todos os Apiários');
  // Add date range filter states
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0], // 3 months ago
    endDate: new Date().toISOString().split('T')[0] // today
  });
  const [showDateFilter, setShowDateFilter] = useState(false);

  const fetchDataWithFilters = async () => {
    setLoading(true);
    try {
      let monitoramentosEndpoint = '/monitoramento';
      let queryParams = new URLSearchParams();
      
      // Add date range params if they exist
      if (dateRange.startDate) {
        queryParams.append('startDate', dateRange.startDate);
      }
      if (dateRange.endDate) {
        queryParams.append('endDate', dateRange.endDate);
      }
      
      // Build the URL with query parameters
      if (queryParams.toString()) {
        monitoramentosEndpoint += `?${queryParams.toString()}`;
      }
      
      // If we have a selected apiario, we'll filter locally after fetching
      const [monitoramentosRes, colmeiasRes, alertasRes, apiariosRes] = await Promise.all([
        api.get(monitoramentosEndpoint),
        api.get('/colmeias'),
        api.get('/alertas'),
        api.get('/apiarios')
      ]);

      let filteredMonitoramentos = monitoramentosRes.data || [];
      let filteredAlertas = alertasRes.data || [];
      
      // Filter by apiario if one is selected
      if (selectedApiario) {
        const apiarioColmeias = colmeiasRes.data.filter(c => c.apiario_id == selectedApiario);
        const colmeiaIds = apiarioColmeias.map(c => c.id);
        
        filteredMonitoramentos = filteredMonitoramentos.filter(m => 
          colmeiaIds.includes(m.colmeia_id)
        );
        
        filteredAlertas = filteredAlertas.filter(a => 
          colmeiaIds.includes(a.colmeia_id)
        );
      }
      
      setMonitoramentos(filteredMonitoramentos);
      setColmeias(colmeiasRes.data);
      setAlertas(filteredAlertas);
      setApiarios(apiariosRes.data);
      
      // Set the apiario name
      if (selectedApiario) {
        const apiario = apiariosRes.data.find(a => a.id == selectedApiario);
        setSelectedApiarioName(apiario ? apiario.nome : 'Apiário Selecionado');
      } else {
        setSelectedApiarioName('Todos os Apiários');
      }
      
      // Identify predator alerts
      const predatorDetections = filteredAlertas.filter(alerta => 
        alerta.descricao_alerta.toLowerCase().includes('predador') || 
        alerta.descricao_alerta.toLowerCase().includes('invasão')
      );
      setPredatorAlerts(predatorDetections);
      
      // Determine seasons based on monitoring dates
      const seasonData = identifySeasons(filteredMonitoramentos);
      setSeasons(seasonData);
      
      // Calculate colony health score
      const health = calculateColonyHealth(filteredMonitoramentos, filteredAlertas, seasonData);
      setHealthStatus(health);
      
      setError('');
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setError('Erro ao carregar dados do dashboard.');
    } finally {
      setLoading(false);
    }
  };
  
  // Update useEffect to use the new function
  useEffect(() => {
    fetchDataWithFilters();
  }, [selectedApiario, dateRange.startDate, dateRange.endDate]);
  
  const handleApiarioChange = (e) => {
    const apiarioId = e.target.value;
    setSelectedApiario(apiarioId);
  };
  
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Identify seasons based on monitoring dates
  const identifySeasons = (data) => {
    if (!data.length) return [];
    
    // Group data by month
    const monthlyData = data.reduce((acc, item) => {
      const date = new Date(item.data_hora);
      const month = date.getMonth();
      
      if (!acc[month]) {
        acc[month] = {
          month: month,
          count: 1,
          temps: [parseFloat(item.temperatura)],
          bees: [parseInt(item.numero_abelhas)]
        };
      } else {
        acc[month].count++;
        acc[month].temps.push(parseFloat(item.temperatura));
        acc[month].bees.push(parseInt(item.numero_abelhas));
      }
      
      return acc;
    }, {});
    
    // Calculate average values for each month and determine season
    return Object.values(monthlyData).map(month => {
      const avgTemp = month.temps.reduce((a, b) => a + b, 0) / month.count;
      const avgBees = month.bees.reduce((a, b) => a + b, 0) / month.count;
      
      let season;
      // Brazilian seasons by meteorological definition (approximate)
      if (month.month >= 11 || month.month <= 1) season = 'Verão';  // Summer: Dec-Feb
      else if (month.month >= 2 && month.month <= 4) season = 'Outono'; // Fall: Mar-May
      else if (month.month >= 5 && month.month <= 7) season = 'Inverno'; // Winter: Jun-Aug
      else season = 'Primavera';  // Spring: Sep-Nov
      
      return {
        month: month.month,
        monthName: new Date(2023, month.month, 1).toLocaleString('pt-BR', {month: 'long'}),
        season,
        avgTemp,
        avgBees
      };
    });
  };

  // Calculate colony health based on multiple factors
  const calculateColonyHealth = (monitoramentos, alertas, seasons) => {
    if (!monitoramentos.length) {
      return { overall: 'Sem dados', score: 0, factors: [] };
    }
    
    // Get the latest 30 days of data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentData = monitoramentos.filter(m => 
      new Date(m.data_hora) >= thirtyDaysAgo
    );
    
    if (!recentData.length) {
      return { 
        overall: 'Sem dados recentes', 
        score: 50, 
        factors: [{name: 'Dados antigos', impact: 'negativo', description: 'Não há dados recentes para análise'}] 
      };
    }
    
    // Current month for seasonal comparison
    const currentMonth = new Date().getMonth();
    const currentSeason = seasons.find(s => s.month === currentMonth);
    
    // Start with base score
    let healthScore = 80;
    const factors = [];
    
    // Factor 1: Bee population trend
    const sortedByDate = [...recentData].sort((a, b) => 
      new Date(a.data_hora) - new Date(b.data_hora)
    );
    
    if (sortedByDate.length >= 2) {
      const firstCount = parseInt(sortedByDate[0].numero_abelhas);
      const lastCount = parseInt(sortedByDate[sortedByDate.length - 1].numero_abelhas);
      const percentChange = ((lastCount - firstCount) / firstCount) * 100;
      
      if (percentChange <= -20) {
        healthScore -= 25;
        factors.push({
          name: 'Queda na população',
          impact: 'negativo',
          description: `Redução de ${Math.abs(percentChange).toFixed(1)}% no número de abelhas`
        });
      } else if (percentChange <= -10) {
        healthScore -= 15;
        factors.push({
          name: 'Leve queda na população',
          impact: 'negativo',
          description: `Redução de ${Math.abs(percentChange).toFixed(1)}% no número de abelhas`
        });
      } else if (percentChange >= 15) {
        healthScore += 10;
        factors.push({
          name: 'Crescimento da população',
          impact: 'positivo',
          description: `Aumento de ${percentChange.toFixed(1)}% no número de abelhas`
        });
      }
    }
    
    // Factor 2: Recent temperature stability
    const temperatures = recentData.map(m => parseFloat(m.temperatura));
    const tempStdDev = calculateStdDev(temperatures);
    
    if (tempStdDev > 5) {
      healthScore -= 10;
      factors.push({
        name: 'Temperatura instável',
        impact: 'negativo',
        description: 'Alta variação de temperatura pode estressar a colônia'
      });
    } else if (tempStdDev < 2) {
      healthScore += 5;
      factors.push({
        name: 'Temperatura estável',
        impact: 'positivo',
        description: 'Condições de temperatura consistentes'
      });
    }
    
    // Factor 3: Recent alerts
    const recentAlerts = alertas.filter(a => 
      new Date(a.data_hora) >= thirtyDaysAgo
    );
    
    if (recentAlerts.length >= 3) {
      healthScore -= 15;
      factors.push({
        name: 'Múltiplos alertas',
        impact: 'negativo',
        description: `${recentAlerts.length} alertas nos últimos 30 dias`
      });
    } else if (recentAlerts.length === 0) {
      healthScore += 5;
      factors.push({
        name: 'Sem alertas recentes',
        impact: 'positivo',
        description: 'Nenhum alerta nos últimos 30 dias'
      });
    }
    
    // Factor 4: Seasonal comparison
    if (currentSeason) {
      const currentAvgBees = recentData.reduce((sum, m) => 
        sum + parseInt(m.numero_abelhas), 0
      ) / recentData.length;
      
      const seasonalExpectedMin = currentSeason.season === 'Inverno' ? 
        currentSeason.avgBees * 0.8 : currentSeason.avgBees * 0.9;
      
      if (currentAvgBees < seasonalExpectedMin) {
        const deficit = ((seasonalExpectedMin - currentAvgBees) / seasonalExpectedMin * 100).toFixed(0);
        healthScore -= 15;
        factors.push({
          name: 'Abaixo da média sazonal',
          impact: 'negativo',
          description: `${deficit}% abaixo do esperado para ${currentSeason.season}`
        });
      } else if (currentAvgBees > currentSeason.avgBees * 1.1) {
        healthScore += 10;
        factors.push({
          name: 'Acima da média sazonal',
          impact: 'positivo',
          description: `Crescimento superior ao esperado para ${currentSeason.season}`
        });
      } else {
        healthScore += 5;
        factors.push({
          name: 'Dentro da média sazonal',
          impact: 'neutro',
          description: `Valores adequados para ${currentSeason.season}`
        });
      }
    }
    
    // Determine overall status
    let overall = 'Normal';
    if (healthScore >= 90) overall = 'Excelente';
    else if (healthScore >= 75) overall = 'Saudável';
    else if (healthScore >= 60) overall = 'Normal';
    else if (healthScore >= 40) overall = 'Requer atenção';
    else overall = 'Crítico';
    
    return {
      overall,
      score: Math.min(100, Math.max(0, healthScore)), // Clamp between 0-100
      factors
    };
  };

  // Helper function to calculate standard deviation
  const calculateStdDev = (array) => {
    const n = array.length;
    if (n === 0) return 0;
    
    const mean = array.reduce((a, b) => a + b) / n;
    const variance = array.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    return Math.sqrt(variance);
  };

  const healthTrendOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          font: {
            family: "'Poppins', sans-serif",
            size: 13
          },
          padding: 20
        }
      },
      title: {
        display: true,
        text: 'Evolução do Índice de Saúde da Colônia',
        font: {
          size: 16,
          weight: 'bold',
          family: "'Poppins', sans-serif"
        },
        color: '#455A64',
        padding: {
          bottom: 15
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
        boxPadding: 8,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            return `Saúde: ${context.parsed.y.toFixed(1)}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          drawBorder: false,
          color: 'rgba(0,0,0,0.04)'
        },
        ticks: {
          font: {
            family: "'Poppins', sans-serif"
          },
          callback: function(value) {
            return value + '%';
          },
          stepSize: 20
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: "'Poppins', sans-serif"
          },
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    elements: {
      line: {
        tension: 0.4
      },
      point: {
        radius: 5,
        hoverRadius: 7
      }
    }
  };

  // Prepare data for colony health chart
  const prepareHealthTrendData = () => {
    if (!monitoramentos.length) return null;
    
    // Group data by date for health trend
    const groupedData = monitoramentos.reduce((acc, item) => {
      const date = new Date(item.data_hora);
      const dateStr = date.toLocaleDateString('pt-BR');
      
      if (!acc[dateStr]) {
        acc[dateStr] = {
          date: date,
          bees: [parseInt(item.numero_abelhas)],
          temps: [parseFloat(item.temperatura)],
          count: 1
        };
      } else {
        acc[dateStr].bees.push(parseInt(item.numero_abelhas));
        acc[dateStr].temps.push(parseFloat(item.temperatura));
        acc[dateStr].count++;
      }
      
      return acc;
    }, {});
    
    // Calculate health score for each day based on bee count, temp and seasonal adjustments
    const dateLabels = Object.keys(groupedData).sort((a, b) => {
      return new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-'));
    }).slice(-14); // Last 14 days
    
    const healthScores = dateLabels.map(dateStr => {
      const item = groupedData[dateStr];
      const seasonalAdjustment = getSeasonalAdjustment(item.date);
      const avgBees = item.bees.reduce((a, b) => a + b, 0) / item.count;
      const normalizedBees = Math.min(100, (avgBees / seasonalAdjustment.expectedBees) * 100);
      
      // Simple health calculation - in real scenario would be more complex
      return Math.min(100, Math.max(0, normalizedBees));
    });
    
    return {
      labels: dateLabels,
      datasets: [
        {
          label: 'Índice de Saúde da Colônia',
          data: healthScores,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#4CAF50',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#4CAF50',
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBorderWidth: 2,
          pointStyle: 'rectRounded'
        }
      ]
    };
  };
  
  // Get seasonal adjustment factors
  const getSeasonalAdjustment = (date) => {
    const month = date.getMonth();
    
    // Default values if no seasonal data available
    let adjustment = {
      season: 'Desconhecido',
      expectedBees: 100,
      temperatureRange: [18, 30]
    };
    
    // Find matching season from our calculated data
    const matchingSeason = seasons.find(s => s.month === month);
    if (matchingSeason) {
      adjustment = {
        season: matchingSeason.season,
        expectedBees: matchingSeason.avgBees,
        temperatureRange: [matchingSeason.avgTemp - 5, matchingSeason.avgTemp + 5]
      };
    } else {
      // Fallback seasonal expectations based on Brazilian seasons
      // These would be better calibrated with actual historical data
      if (month >= 11 || month <= 1) { // Summer
        adjustment = {
          season: 'Verão',
          expectedBees: 120,
          temperatureRange: [25, 35]
        };
      } else if (month >= 2 && month <= 4) { // Fall
        adjustment = {
          season: 'Outono',
          expectedBees: 100,
          temperatureRange: [20, 30]
        };
      } else if (month >= 5 && month <= 7) { // Winter
        adjustment = {
          season: 'Inverno',
          expectedBees: 80,
          temperatureRange: [15, 25]
        };
      } else { // Spring
        adjustment = {
          season: 'Primavera',
          expectedBees: 110,
          temperatureRange: [18, 28]
        };
      }
    }
    
    return adjustment;
  };

  // Prepare data for seasonal comparison
  const prepareSeasonalComparisonData = () => {
    if (!seasons.length) return null;
    
    // Sort seasons by month
    const sortedSeasons = [...seasons].sort((a, b) => a.month - b.month);
    
    return {
      labels: sortedSeasons.map(s => s.monthName),
      datasets: [
        {
          label: 'Média de Abelhas',
          data: sortedSeasons.map(s => s.avgBees),
          backgroundColor: 'rgba(255, 193, 7, 0.7)',
          borderColor: 'rgba(255, 193, 7, 1)',
          borderWidth: 1,
          borderRadius: 6,
          barThickness: 20,
          maxBarThickness: 30
        },
        {
          label: 'Temperatura Média (°C)',
          data: sortedSeasons.map(s => s.avgTemp),
          backgroundColor: 'rgba(255, 87, 34, 0.7)',
          borderColor: 'rgba(255, 87, 34, 1)',
          borderWidth: 1,
          borderRadius: 6,
          barThickness: 20,
          maxBarThickness: 30,
          yAxisID: 'y1'
        }
      ]
    };
  };
  
  // Prepare colony health distribution data
  const prepareHealthDistributionData = () => {
    if (!monitoramentos.length) return null;
    
    // Count occurrences of each situation (health status)
    const situacoes = monitoramentos.reduce((acc, item) => {
      if (!acc[item.situacao]) {
        acc[item.situacao] = 1;
      } else {
        acc[item.situacao]++;
      }
      return acc;
    }, {});
    
    // Define health categories and colors based on bee colony health
    const categories = {
      'Normal': '#4CAF50',
      'Saudável': '#8BC34A',
      'Requer atenção': '#FFC107',
      'Em observação': '#FF9800',
      'Crítico': '#F44336'
    };
    
    // Generate colors for situacoes that aren't in our predefined categories
    const backgroundColors = [];
    const borderColors = [];
    const hoverBackgroundColors = [];
    
    Object.keys(situacoes).forEach(situacao => {
      if (categories[situacao]) {
        const color = categories[situacao];
        backgroundColors.push(`${color}CC`); // Add transparency
        borderColors.push(color);
        hoverBackgroundColors.push(`${color}EE`); // Less transparency on hover
      } else {
        // Default color for undefined categories
        backgroundColors.push('rgba(158, 158, 158, 0.7)');
        borderColors.push('rgba(158, 158, 158, 1)');
        hoverBackgroundColors.push('rgba(158, 158, 158, 0.9)');
      }
    });
    
    return {
      labels: Object.keys(situacoes),
      datasets: [
        {
          data: Object.values(situacoes),
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          hoverBackgroundColor: hoverBackgroundColors,
          borderWidth: 2
        }
      ]
    };
  };

  // Prepare predator detection data for visualization
  const preparePredatorData = () => {
    if (!predatorAlerts.length) return null;
    
    // Group predator alerts by date
    const groupedByDate = predatorAlerts.reduce((acc, alert) => {
      const date = new Date(alert.data_hora);
      const dateStr = date.toLocaleDateString('pt-BR');
      
      if (!acc[dateStr]) {
        acc[dateStr] = 1;
      } else {
        acc[dateStr]++;
      }
      return acc;
    }, {});
    
    // Sort dates chronologically
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
      return new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-'));
    });
    
    // Get the last 14 days with predator activity
    const recentDates = sortedDates.slice(-14);
    
    return {
      labels: recentDates,
      datasets: [
        {
          label: 'Detecções de Predadores',
          data: recentDates.map(date => groupedByDate[date]),
          backgroundColor: 'rgba(244, 67, 54, 0.7)',
          borderColor: 'rgba(244, 67, 54, 1)',
          borderWidth: 2,
          borderRadius: 6,
          barThickness: 20,
          maxBarThickness: 30
        }
      ]
    };
  };
  
  // Bee population metric options
  const seasonalComparisonOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          font: {
            family: "'Poppins', sans-serif",
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Variação Sazonal: Abelhas e Temperatura',
        font: {
          size: 16,
          weight: 'bold',
          family: "'Poppins', sans-serif"
        },
        color: '#455A64',
        padding: {
          bottom: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
        title: {
          display: true,
          text: 'Número de Abelhas',
          font: {
            family: "'Poppins', sans-serif",
            weight: 'bold'
          }
        },
        grid: {
          drawBorder: false,
          color: 'rgba(0,0,0,0.05)'
        },
        ticks: {
          font: {
            family: "'Poppins', sans-serif"
          }
        }
      },
      y1: {
        position: 'right',
        title: {
          display: true,
          text: 'Temperatura (°C)',
          font: {
            family: "'Poppins', sans-serif",
            weight: 'bold'
          }
        },
        grid: {
          display: false
        },
        beginAtZero: false,
        ticks: {
          font: {
            family: "'Poppins', sans-serif"
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: "'Poppins', sans-serif"
          }
        }
      }
    }
  };
  
  const healthDistributionOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: "'Poppins', sans-serif",
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Distribuição de Status de Saúde',
        font: {
          size: 16,
          weight: 'bold',
          family: "'Poppins', sans-serif"
        },
        color: '#455A64',
        padding: {
          bottom: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#455A64',
        bodyColor: '#455A64',
        borderColor: '#FFD54F',
        borderWidth: 1,
        cornerRadius: 8,
        boxPadding: 6,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round(value / total * 100);
            return `${label}: ${value} registros (${percentage}%)`;
          }
        }
      }
    },
    cutout: '65%',
    elements: {
      arc: {
        borderWidth: 2
      }
    },
    animation: {
      animateScale: true,
      animateRotate: true
    }
  };

  const predatorChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          font: {
            family: "'Poppins', sans-serif",
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Detecção de Predadores por Data',
        font: {
          size: 16,
          weight: 'bold',
          family: "'Poppins', sans-serif"
        },
        color: '#455A64',
        padding: {
          bottom: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#455A64',
        bodyColor: '#455A64',
        borderColor: '#F44336',
        borderWidth: 1,
        cornerRadius: 8,
        boxPadding: 6,
        callbacks: {
          label: function(context) {
            const value = context.raw || 0;
            return `Detecções: ${value}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Número de Detecções',
          font: {
            family: "'Poppins', sans-serif",
            weight: 'bold'
          }
        },
        ticks: {
          stepSize: 1,
          font: {
            family: "'Poppins', sans-serif"
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: "'Poppins', sans-serif"
          }
        }
      }
    }
  };
  
  // Colony Health Card Component
  const ColonyHealthCard = ({ healthStatus }) => {
    const getHealthColor = (status) => {
      switch(status) {
        case 'Excelente': return 'success';
        case 'Saudável': return 'success';
        case 'Normal': return 'info';
        case 'Requer atenção': return 'warning';
        case 'Crítico': return 'danger';
        default: return 'secondary';
      }
    };
    
    return (
      <Card className="h-100 shadow-sm border-0">
        <Card.Body>
          <h5 className="border-bottom pb-2 mb-3">
            <i className="fas fa-heartbeat me-2"></i>
            Status de Saúde da Colônia
          </h5>
          
          <div className="d-flex justify-content-center mb-3">
            <div className="text-center">
              <div 
                className="health-score-circle mb-2" 
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `conic-gradient(
                    ${healthStatus.score >= 75 ? '#4CAF50' : 
                      healthStatus.score >= 50 ? '#FFC107' : '#F44336'} 
                    ${healthStatus.score}%, 
                    #e0e0e0 ${healthStatus.score}%
                  )`,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  position: 'relative'
                }}
              >
                <div 
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: healthStatus.score >= 75 ? '#4CAF50' : 
                           healthStatus.score >= 50 ? '#FFC107' : '#F44336'
                  }}
                >
                  {healthStatus.score}%
                </div>
              </div>
              <Badge bg={getHealthColor(healthStatus.overall)} className="fs-6 px-3 py-2">
                {healthStatus.overall}
              </Badge>
            </div>
          </div>
          
          <h6 className="mt-4 mb-3">Fatores que influenciam a saúde:</h6>
          <ul className="factor-list ps-0">
            {healthStatus.factors.map((factor, index) => (
              <li key={index} className="mb-2">
                <div className="d-flex align-items-start">
                  <span 
                    className={`me-2 mt-1 badge bg-${
                      factor.impact === 'positivo' ? 'success' : 
                      factor.impact === 'negativo' ? 'danger' : 'info'
                    }`}
                    style={{width: '10px', height: '10px', padding: '0', borderRadius: '50%'}}
                  ></span>
                  <div>
                    <strong>{factor.name}</strong>
                    <div className="text-muted small">{factor.description}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card.Body>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Carregando...</span>
        </Spinner>
        <p className="mt-2">Carregando dados dos gráficos...</p>
      </div>
    );
  }

  const healthTrendData = prepareHealthTrendData();
  const seasonalComparisonData = prepareSeasonalComparisonData();
  const healthDistributionData = prepareHealthDistributionData();
  const predatorData = preparePredatorData();

  return (
    <div className="graph-dashboard">
      <div className="d-flex justify-content-between align-items-center flex-wrap mb-4">
        <div>
          <h2 className="mb-1 main-title d-flex align-items-center">
            <div className="me-3 p-2 rounded-circle bg-primary-light d-inline-flex align-items-center justify-content-center">
              <i className="fas fa-chart-line text-primary"></i>
            </div>
            Dashboard Analítico
          </h2>
          <p className="text-muted mb-0">Análise avançada da saúde e produtividade das colônias</p>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row className="mb-4 g-3">
        <Col lg={6} className="mb-3 mb-lg-0">
          <Card className="shadow-sm border-0 h-100 filter-card">
            <Card.Header className="bg-white border-bottom-0 d-flex align-items-center">
              <div className="me-2 rounded-circle bg-primary-light p-2 d-flex align-items-center justify-content-center">
                <i className="fas fa-filter text-primary"></i>
              </div>
              <h5 className="mb-0 fw-semibold">Filtrar por Apiário</h5>
            </Card.Header>
            <Card.Body>
              <Form.Select 
                value={selectedApiario} 
                onChange={handleApiarioChange}
                className="form-select-lg border-0 shadow-sm"
              >
                <option value="">Todos os Apiários</option>
                {apiarios.map(apiario => (
                  <option key={apiario.id} value={apiario.id}>
                    {apiario.nome} - {apiario.localizacao}
                  </option>
                ))}
              </Form.Select>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={6}>
          <Card className="shadow-sm border-0 h-100 filter-card">
            <Card.Header className="bg-white border-bottom-0 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <div className="me-2 rounded-circle bg-primary-light p-2 d-flex align-items-center justify-content-center">
                  <i className="fas fa-calendar-alt text-primary"></i>
                </div>
                <h5 className="mb-0 fw-semibold">Período de Análise</h5>
              </div>
              <Button 
                variant="link" 
                className="p-0 text-dark shadow-none" 
                onClick={() => setShowDateFilter(!showDateFilter)}
                aria-expanded={showDateFilter}
              >
                <i className={`fas fa-chevron-${showDateFilter ? 'up' : 'down'}`}></i>
              </Button>
            </Card.Header>
            <Card.Body className={showDateFilter ? '' : 'd-none d-lg-block'}>
              <Row>
                <Col md={6} className="mb-3 mb-md-0">
                  <Form.Group>
                    <Form.Label className="small mb-1 text-muted fw-medium">Data Inicial</Form.Label>
                    <Form.Control
                      type="date"
                      name="startDate"
                      value={dateRange.startDate}
                      onChange={handleDateRangeChange}
                      max={dateRange.endDate}
                      className="border-0 shadow-sm"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small mb-1 text-muted fw-medium">Data Final</Form.Label>
                    <Form.Control
                      type="date"
                      name="endDate"
                      value={dateRange.endDate}
                      onChange={handleDateRangeChange}
                      min={dateRange.startDate}
                      className="border-0 shadow-sm"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="mb-4 bg-white p-4 rounded-4 shadow-sm text-center">
        <h3 className="fs-4 fw-bold text-primary mb-2">
          <i className="fas fa-leaf me-2"></i>
          Dashboard de Saúde: {selectedApiarioName}
        </h3>
        <p className="text-muted">
          Período: {new Date(dateRange.startDate).toLocaleDateString('pt-BR')} até {new Date(dateRange.endDate).toLocaleDateString('pt-BR')}
        </p>
        <div className="mx-auto mb-0" style={{width:"60px", height:"4px", background:"var(--primary)", borderRadius:"2px"}}></div>
      </div>

      <Row className="mb-4">
        <Col lg={8} className="mb-4">
          <Card className="shadow-sm border-0 h-100 graph-card">
            <Card.Body className="p-3 p-md-4">
              {healthTrendData ? (
                <Line 
                  data={healthTrendData} 
                  options={healthTrendOptions} 
                  height={90}
                  className="chart-shadow"
                />
              ) : (
                <div className="text-center py-5">
                  <p className="text-muted">Sem dados suficientes para gerar o gráfico</p>
                </div>
              )}
              <div className="mt-3 text-center text-muted small">
                <div><i className="fas fa-info-circle me-1"></i> O índice de saúde considera número de abelhas, temperatura e variações sazonais</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4} className="mb-4">
          <ColonyHealthCard healthStatus={healthStatus} />
        </Col>
      </Row>

      <Row>
        <Col lg={6} className="mb-4">
          <Card className="shadow-sm border-0 h-100">
            <Card.Body className="p-3 p-md-4">
              {seasonalComparisonData ? (
                <Bar 
                  data={seasonalComparisonData} 
                  options={seasonalComparisonOptions}
                  height={110}
                />
              ) : (
                <div className="text-center py-5">
                  <p className="text-muted">Sem dados suficientes para análise sazonal</p>
                </div>
              )}
              <div className="mt-3 text-center text-muted small">
                <div><i className="fas fa-info-circle me-1"></i> A saúde da colônia deve ser avaliada considerando o contexto da estação</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6} className="mb-4">
          <Card className="shadow-sm border-0 h-100">
            <Card.Body className="p-3 p-md-4">
              {healthDistributionData ? (
                <Doughnut 
                  data={healthDistributionData} 
                  options={healthDistributionOptions}
                  height={80}
                />
              ) : (
                <div className="text-center py-5">
                  <p className="text-muted">Sem dados suficientes para gerar o gráfico</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={8} className="mb-4">
          <Card className="shadow-sm border-0 h-100">
            <Card.Header className="bg-light">
              <h5 className="mb-0">
                <i className="fas fa-shield-alt me-2 text-danger"></i>
                Monitoramento de Predadores
              </h5>
            </Card.Header>
            <Card.Body className="p-3 p-md-4">
              {predatorData ? (
                <Bar 
                  data={predatorData} 
                  options={predatorChartOptions}
                  height={100}
                />
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-shield-alt fa-3x mb-3 text-muted"></i>
                  <p className="text-muted">Nenhuma detecção de predadores registrada no período.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4} className="mb-4">
          <Card className="shadow-sm border-0 h-100 predator-alert-card">
            <Card.Header className="bg-light">
              <h5 className="mb-0">
                <i className="fas fa-exclamation-triangle me-2 text-danger"></i>
                Alertas de Predadores
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              {predatorAlerts.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {predatorAlerts.slice(0, 5).map((alert, index) => (
                    <li key={index} className="list-group-item border-bottom">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="badge bg-danger me-2">
                          <i className="fas fa-bug me-1"></i>
                        </span>
                        <div className="ms-2 me-auto">
                          <div className="fw-bold">{new Date(alert.data_hora).toLocaleDateString('pt-BR')}</div>
                          <small>{alert.descricao_alerta}</small>
                        </div>
                        <Badge bg="danger" pill>
                          {alert.nome_colmeia || 'Colmeia ' + alert.colmeia_id}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-check-circle fa-3x mb-3 text-success"></i>
                  <p className="text-muted">Nenhum predador detectado. Colmeias seguras!</p>
                </div>
              )}
            </Card.Body>
            <Card.Footer className="bg-white text-center">
              <small className="text-muted">
                <i className="fas fa-info-circle me-1"></i>
                Sistema monitorando ativamente a presença de predadores
              </small>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      <div className="alert alert-info mb-4">
        <div className="d-flex">
          <div className="me-3 fs-4">
            <i className="fas fa-lightbulb"></i>
          </div>
          <div>
            <h5 className="alert-heading">Como interpretar a saúde da colônia</h5>
            <p className="mb-0">A saúde da colônia varia naturalmente conforme as estações. Na primavera e verão, espera-se um maior número de abelhas e atividade. No outono e inverno, é normal uma redução na população. O gráfico de saúde ajusta esses valores sazonalmente.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphDashboard;
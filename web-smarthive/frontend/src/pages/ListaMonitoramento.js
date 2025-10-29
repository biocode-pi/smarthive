import React, { useState, useEffect } from 'react';
import { Table, Card, Alert, Spinner, Form, InputGroup } from 'react-bootstrap';
import api from '../services/api';

const ListaMonitoramento = () => {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRegistros();
  }, []);

  const fetchRegistros = async () => {
    try {
      const response = await api.get('/monitoramento');
      setRegistros(response.data);
      setError('');
    } catch (error) {
      console.error('Erro ao buscar registros:', error);
      setError('Erro ao carregar os registros. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('pt-BR');
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredRegistros = registros.filter(registro => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      registro.clima.toLowerCase().includes(searchTermLower) ||
      registro.situacao.toLowerCase().includes(searchTermLower) ||
      (registro.observacoes && registro.observacoes.toLowerCase().includes(searchTermLower))
    );
  });

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Carregando...</span>
        </Spinner>
        <p className="mt-2">Carregando registros...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-center mb-4 main-title">Registros de Monitoramento</h2>
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      <Card>
        <Card.Header>Lista de Registros</Card.Header>
        <Card.Body>
          <InputGroup className="mb-3">
            <InputGroup.Text id="search-addon">
              <i className="bi bi-search"></i> Buscar
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar por clima, situação ou observações..."
              value={searchTerm}
              onChange={handleSearch}
              aria-label="Buscar"
              aria-describedby="search-addon"
            />
          </InputGroup>
          
          {filteredRegistros.length === 0 ? (
            <Alert variant="info">
              Nenhum registro encontrado.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Data e Hora</th>
                    <th>Número de Abelhas</th>
                    <th>Temperatura (°C)</th>
                    <th>Clima</th>
                    <th>Situação</th>
                    <th>Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistros.map(registro => (
                    <tr key={registro.id}>
                      <td>{registro.id}</td>
                      <td>{formatDateTime(registro.data_hora)}</td>
                      <td>{registro.numero_abelhas}</td>
                      <td>{registro.temperatura}</td>
                      <td>{registro.clima}</td>
                      <td>
                        <span className={`badge ${
                          registro.situacao === 'Normal' ? 'bg-success' :
                          registro.situacao === 'Alerta' ? 'bg-warning' :
                          registro.situacao === 'Crítico' ? 'bg-danger' : 'bg-info'
                        }`}>
                          {registro.situacao}
                        </span>
                      </td>
                      <td>{registro.observacoes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
        <Card.Footer className="text-muted">
          Total de registros: {filteredRegistros.length}
        </Card.Footer>
      </Card>
    </div>
  );
};

export default ListaMonitoramento;


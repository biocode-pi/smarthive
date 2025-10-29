'use client';

import { useState, useEffect } from 'react';
import { Table, Card, Alert, Button, Form, InputGroup, Modal, Badge } from 'react-bootstrap';
import api from '@/lib/api';

export default function AlertasPage() {
  const [alertas, setAlertas] = useState([]);
  const [colmeias, setColmeias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    colmeia_id: '',
    descricao_alerta: '',
    data_hora: ''
  });
  const [savingAlerta, setSavingAlerta] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [alertasRes, colmeiasRes] = await Promise.all([
        api.get('/alertas'),
        api.get('/colmeias')
      ]);
      
      setAlertas(alertasRes.data);
      setColmeias(colmeiasRes.data);
      setError('');
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setError('Erro ao carregar os alertas. Por favor, tente novamente.');
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
  
  const handleModalClose = () => {
    setShowModal(false);
    setFormData({
      colmeia_id: '',
      descricao_alerta: '',
      data_hora: ''
    });
  };
  
  const handleModalShow = () => {
    const now = new Date();
    const formattedDateTime = now.toISOString().slice(0, 16);
    
    setFormData({
      ...formData,
      data_hora: formattedDateTime
    });
    setShowModal(true);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSavingAlerta(true);
    
    try {
      await api.post('/alertas', formData);
      
      const currentCount = parseInt(localStorage.getItem('notificationCount') || '0');
      localStorage.setItem('notificationCount', (currentCount + 1).toString());
      window.dispatchEvent(new CustomEvent('newNotification'));
      
      setSuccessMessage('Alerta criado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
      handleModalClose();
      fetchData();
    } catch (error) {
      console.error('Erro ao criar alerta:', error);
      setError('Erro ao criar o alerta. Tente novamente.');
    } finally {
      setSavingAlerta(false);
    }
  };
  
  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este alerta?')) {
      try {
        await api.delete(`/alertas/${id}`);
        setAlertas(alertas.filter(alerta => alerta.id !== id));
        setSuccessMessage('Alerta excluído com sucesso!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Erro ao excluir alerta:', error);
        setError('Erro ao excluir o alerta. Tente novamente.');
      }
    }
  };

  const filteredAlertas = alertas.filter(alerta => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      alerta.descricao_alerta.toLowerCase().includes(searchTermLower) ||
      (alerta.nome_colmeia && alerta.nome_colmeia.toLowerCase().includes(searchTermLower))
    );
  });
  
  const sortedAlertas = [...filteredAlertas].sort((a, b) => {
    return new Date(b.data_hora) - new Date(a.data_hora);
  });

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
        <p className="mt-2">Carregando alertas...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap mb-4">
        <h2 className="mb-2 mb-md-0 main-title">
          <i className="fas fa-bell me-2"></i>Alertas
        </h2>
        <Button variant="primary" onClick={handleModalShow}>
          <i className="fas fa-plus me-2"></i>Novo Alerta
        </Button>
      </div>
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          <i className="fas fa-exclamation-circle me-2"></i>{error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>
          <i className="fas fa-check-circle me-2"></i>{successMessage}
        </Alert>
      )}
      
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <h5 className="mb-0 me-2">Registro de Alertas</h5>
            <Badge bg="primary" pill>{sortedAlertas.length} alertas</Badge>
          </div>
        </Card.Header>
        <Card.Body>
          <InputGroup className="mb-3">
            <InputGroup.Text>
              <i className="fas fa-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar por colmeia ou descrição..."
              value={searchTerm}
              onChange={handleSearch}
              aria-label="Buscar"
            />
          </InputGroup>
          
          {sortedAlertas.length === 0 ? (
            <Alert variant="info">
              <i className="fas fa-info-circle me-2"></i>Nenhum alerta encontrado.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead>
                  <tr>
                    <th>Data e Hora</th>
                    <th>Colmeia</th>
                    <th>Descrição</th>
                    <th className="text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAlertas.map(alerta => (
                    <tr key={alerta.id}>
                      <td className="text-nowrap">
                        <i className="fas fa-calendar-alt me-2 text-muted"></i>
                        {formatDateTime(alerta.data_hora)}
                      </td>
                      <td>
                        <Badge bg="light" text="dark" className="border">
                          {alerta.nome_colmeia}
                        </Badge>
                      </td>
                      <td>{alerta.descricao_alerta}</td>
                      <td className="text-center">
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleDelete(alerta.id)}
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
      
      <Modal show={showModal} onHide={handleModalClose} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-bell me-2"></i>Novo Alerta
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Colmeia</Form.Label>
              <Form.Select 
                name="colmeia_id" 
                value={formData.colmeia_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Selecione uma colmeia</option>
                {colmeias.map(colmeia => (
                  <option key={colmeia.id} value={colmeia.id}>
                    {colmeia.nome} - {colmeia.localizacao}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Data e Hora</Form.Label>
              <Form.Control
                type="datetime-local"
                name="data_hora"
                value={formData.data_hora}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Descrição do Alerta</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="descricao_alerta"
                value={formData.descricao_alerta}
                onChange={handleInputChange}
                placeholder="Descreva o alerta"
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={handleModalClose}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={savingAlerta}>
              {savingAlerta ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}


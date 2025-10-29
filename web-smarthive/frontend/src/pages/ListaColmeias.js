import React, { useState, useEffect } from 'react';
import { Table, Card, Alert, Button, Badge, Form, InputGroup, Modal, Row, Col } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const ListaColmeias = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const apiarioFilter = searchParams.get('apiario');
  
  const [colmeias, setColmeias] = useState([]);
  const [apiarios, setApiarios] = useState([]);
  const [selectedApiario, setSelectedApiario] = useState(apiarioFilter || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para o modal de cadastro/edição
  const [showModal, setShowModal] = useState(false);
  const [editingColmeia, setEditingColmeia] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    localizacao: '',
    status: '',
    apiario_id: ''
  });
  const [savingColmeia, setSavingColmeia] = useState(false);
  
  // Estado para o modal de detalhes
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedColmeia, setSelectedColmeia] = useState(null);
  const [monitoramentos, setMonitoramentos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (apiarioFilter) {
      setSelectedApiario(apiarioFilter);
    }
    fetchData();
  }, [apiarioFilter]);
  
  const fetchData = async () => {
    try {
      // Fetch apiaries first
      const apiariosRes = await api.get('/apiarios');
      setApiarios(apiariosRes.data);
      
      // Fetch colmeias based on apiario filter
      let endpoint = '/colmeias';
      if (apiarioFilter) {
        endpoint = `/apiarios/${apiarioFilter}/colmeias`;
      }
      
      const colmeiasRes = await api.get(endpoint);
      setColmeias(colmeiasRes.data);
      setError('');
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setError('Erro ao carregar as colmeias. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleApiarioChange = (e) => {
    const apiarioId = e.target.value;
    setSelectedApiario(apiarioId);
    
    // Update URL without reload
    const url = new URL(window.location);
    if (apiarioId) {
      url.searchParams.set('apiario', apiarioId);
    } else {
      url.searchParams.delete('apiario');
    }
    window.history.pushState({}, '', url);
    
    // Re-fetch data based on selection
    fetchColmeiasForApiario(apiarioId);
  };
  
  const fetchColmeiasForApiario = async (apiarioId) => {
    setLoading(true);
    try {
      let endpoint = '/colmeias';
      if (apiarioId) {
        endpoint = `/apiarios/${apiarioId}/colmeias`;
      }
      
      const response = await api.get(endpoint);
      setColmeias(response.data);
    } catch (error) {
      console.error('Erro ao buscar colmeias:', error);
      setError('Erro ao filtrar colmeias por apiário.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleModalClose = () => {
    setShowModal(false);
    setEditingColmeia(null);
    setFormData({
      nome: '',
      localizacao: '',
      status: '',
      apiario_id: ''
    });
  };
  
  const handleModalShow = (colmeia = null) => {
    if (colmeia) {
      setEditingColmeia(colmeia);
      setFormData({
        nome: colmeia.nome,
        localizacao: colmeia.localizacao,
        status: colmeia.status,
        apiario_id: colmeia.apiario_id
      });
    } else {
      setEditingColmeia(null);
      setFormData({
        nome: '',
        localizacao: '',
        status: '',
        apiario_id: ''
      });
    }
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
    setSavingColmeia(true);
    
    try {
      if (editingColmeia) {
        await api.put(`/colmeias/${editingColmeia.id}`, formData);
      } else {
        await api.post('/colmeias', formData);
      }
      
      handleModalClose();
      fetchData();
    } catch (error) {
      console.error('Erro ao salvar colmeia:', error);
      setError(`Erro ao ${editingColmeia ? 'atualizar' : 'cadastrar'} a colmeia. Tente novamente.`);
    } finally {
      setSavingColmeia(false);
    }
  };
  
  const handleShowDetails = async (colmeia) => {
    setSelectedColmeia(colmeia);
    setLoadingDetails(true);
    
    try {
      const [monitoramentosRes, alertasRes] = await Promise.all([
        api.get(`/colmeias/${colmeia.id}/monitoramentos`),
        api.get(`/colmeias/${colmeia.id}/alertas`)
      ]);
      
      setMonitoramentos(monitoramentosRes.data);
      setAlertas(alertasRes.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      setError('Erro ao carregar detalhes da colmeia.');
    } finally {
      setLoadingDetails(false);
    }
  };
  
  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedColmeia(null);
    setMonitoramentos([]);
    setAlertas([]);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta colmeia?')) {
      try {
        await api.delete(`/colmeias/${id}`);
        setColmeias(colmeias.filter(colmeia => colmeia.id !== id));
      } catch (error) {
        console.error('Erro ao excluir colmeia:', error);
        setError('Erro ao excluir a colmeia. Por favor, tente novamente.');
      }
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'secondary';
    
    switch (status.toLowerCase()) {
      case 'ativa':
        return 'success';
      case 'em manutenção':
        return 'warning';
      case 'inativa':
        return 'danger';
      default:
        return 'secondary';
    }
  };
  
  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('pt-BR');
  };

  const filteredColmeias = colmeias.filter(colmeia => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      colmeia.nome.toLowerCase().includes(searchTermLower) ||
      colmeia.localizacao.toLowerCase().includes(searchTermLower) ||
      colmeia.status.toLowerCase().includes(searchTermLower)
    );
  });

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
        <p className="mt-2">Carregando colmeias...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap mb-4">
        <h2 className="mb-2 mb-md-0 main-title">Gerenciamento de Colmeias</h2>
        <Button onClick={() => handleModalShow()} variant="primary">
          <i className="fas fa-plus me-2"></i>Nova Colmeia
        </Button>
      </div>
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          <i className="fas fa-exclamation-circle me-2"></i>{error}
        </Alert>
      )}
      
      <Card className="mb-4">
        <Card.Header>Filtro por Apiário</Card.Header>
        <Card.Body>
          <Form.Group>
            <Form.Select 
              value={selectedApiario} 
              onChange={handleApiarioChange}
              className="mb-0"
            >
              <option value="">Todos os Apiários</option>
              {apiarios.map(apiario => (
                <option key={apiario.id} value={apiario.id}>
                  {apiario.nome} - {apiario.localizacao}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center flex-wrap">
          <h5 className="mb-0 me-2"><i className="fas fa-home me-2"></i>Colmeias Cadastradas</h5>
          <small className="text-muted">{filteredColmeias.length} colmeias encontradas</small>
        </Card.Header>
        <Card.Body>
          <InputGroup className="mb-3">
            <InputGroup.Text>
              <i className="fas fa-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar por nome, localização ou status..."
              value={searchTerm}
              onChange={handleSearch}
              aria-label="Buscar"
            />
          </InputGroup>
          
          {filteredColmeias.length === 0 ? (
            <Alert variant="info">
              <i className="fas fa-info-circle me-2"></i>Nenhuma colmeia encontrada.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Localização</th>
                    <th>Status</th>
                    <th className="text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredColmeias.map(colmeia => (
                    <tr key={colmeia.id}>
                      <td>
                        <strong>{colmeia.nome}</strong>
                      </td>
                      <td>{colmeia.localizacao}</td>
                      <td>
                        <Badge bg={getStatusColor(colmeia.status)} pill>
                          {colmeia.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-1">
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => handleShowDetails(colmeia)}
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button 
                            variant="outline-warning" 
                            size="sm"
                            onClick={() => handleModalShow(colmeia)}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDelete(colmeia.id)}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
        <Card.Footer className="text-muted">
          Total de colmeias: {filteredColmeias.length}
        </Card.Footer>
      </Card>
      
      {/* Modal para Cadastro/Edição */}
      <Modal show={showModal} onHide={handleModalClose} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingColmeia ? 'Editar Colmeia' : 'Nova Colmeia'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nome da Colmeia</Form.Label>
              <Form.Control
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                placeholder="Digite o nome da colmeia"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Localização</Form.Label>
              <Form.Control
                type="text"
                name="localizacao"
                value={formData.localizacao}
                onChange={handleInputChange}
                placeholder="Digite a localização da colmeia"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <option value="">Selecione o status</option>
                <option value="Ativa">Ativa</option>
                <option value="Em manutenção">Em manutenção</option>
                <option value="Inativa">Inativa</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Apiário</Form.Label>
              <Form.Select
                name="apiario_id"
                value={formData.apiario_id || ''}
                onChange={handleInputChange}
              >
                <option value="">Selecione o apiário</option>
                {apiarios.map(apiario => (
                  <option key={apiario.id} value={apiario.id}>
                    {apiario.nome} - {apiario.localizacao}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Selecione o apiário ao qual esta colmeia pertence
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={handleModalClose}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={savingColmeia}>
              {savingColmeia ? (
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
      
      {/* Modal de Detalhes */}
      <Modal show={showDetailsModal} onHide={handleCloseDetails} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-home me-2"></i>
            {selectedColmeia?.nome}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingDetails ? (
            <div className="text-center my-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
              <p className="mt-2">Carregando detalhes...</p>
            </div>
          ) : (
            <>
              <Row className="mb-4">
                <Col md={6}>
                  <div className="mb-3">
                    <strong>Localização:</strong> {selectedColmeia?.localizacao}
                  </div>
                  <div>
                    <strong>Status:</strong>{' '}
                    <Badge bg={getStatusColor(selectedColmeia?.status)}>
                      {selectedColmeia?.status}
                    </Badge>
                  </div>
                </Col>
                <Col md={6} className="d-flex justify-content-end align-items-center">
                  <Button
                    variant="outline-warning"
                    size="sm"
                    className="me-2"
                    onClick={() => {
                      handleCloseDetails();
                      handleModalShow(selectedColmeia);
                    }}
                  >
                    <i className="fas fa-edit me-1"></i> Editar
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => {
                      if (window.confirm('Tem certeza que deseja excluir esta colmeia?')) {
                        handleCloseDetails();
                        handleDelete(selectedColmeia.id);
                      }
                    }}
                  >
                    <i className="fas fa-trash me-1"></i> Excluir
                  </Button>
                </Col>
              </Row>
              
              <h5 className="border-bottom pb-2 mb-3">
                <i className="fas fa-clipboard-list me-2"></i>Monitoramentos Recentes
              </h5>
              
              {monitoramentos.length === 0 ? (
                <Alert variant="info">
                  Nenhum monitoramento registrado para esta colmeia.
                </Alert>
              ) : (
                <div className="table-responsive mb-4">
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Abelhas</th>
                        <th>Temperatura</th>
                        <th>Situação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monitoramentos.slice(0, 5).map(item => (
                        <tr key={item.id}>
                          <td>{formatDateTime(item.data_hora)}</td>
                          <td>{item.numero_abelhas}</td>
                          <td>{item.temperatura}°C</td>
                          <td>
                            <Badge bg={
                              item.situacao === 'Normal' ? 'success' :
                              item.situacao === 'Alerta' ? 'warning' :
                              item.situacao === 'Crítico' ? 'danger' : 'info'
                            }>
                              {item.situacao}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
              
              <h5 className="border-bottom pb-2 mb-3">
                <i className="fas fa-bell me-2"></i>Alertas Recentes
              </h5>
              
              {alertas.length === 0 ? (
                <Alert variant="info">
                  Nenhum alerta registrado para esta colmeia.
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Descrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alertas.slice(0, 5).map(alerta => (
                        <tr key={alerta.id}>
                          <td>{formatDateTime(alerta.data_hora)}</td>
                          <td>{alerta.descricao_alerta}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Link to={`/cadastro`} className="btn btn-success">
            <i className="fas fa-plus me-1"></i> Novo Monitoramento
          </Link>
          <Button variant="secondary" onClick={handleCloseDetails}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ListaColmeias;
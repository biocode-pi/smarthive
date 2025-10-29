import React, { useState, useEffect } from 'react';
import { Table, Card, Alert, Button, Badge, Form, InputGroup, Modal, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const ListaApiarios = () => {
  const [apiarios, setApiarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  // Estados para o modal de cadastro/edição
  const [showModal, setShowModal] = useState(false);
  const [editingApiario, setEditingApiario] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    localizacao: '',
    responsavel: '',
    descricao: ''
  });
  const [savingApiario, setSavingApiario] = useState(false);
  
  // Estado para o modal de estatísticas
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedApiario, setSelectedApiario] = useState(null);
  const [apiarioStats, setApiarioStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    fetchApiarios();
  }, []);

  const fetchApiarios = async () => {
    try {
      const response = await api.get('/apiarios');
      setApiarios(response.data);
      setError('');
    } catch (error) {
      console.error('Erro ao buscar apiários:', error);
      setError('Erro ao carregar os apiários. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleModalClose = () => {
    setShowModal(false);
    setEditingApiario(null);
    setFormData({
      nome: '',
      localizacao: '',
      responsavel: '',
      descricao: ''
    });
  };
  
  const handleModalShow = (apiario = null) => {
    if (apiario) {
      setEditingApiario(apiario);
      setFormData({
        nome: apiario.nome,
        localizacao: apiario.localizacao,
        responsavel: apiario.responsavel || '',
        descricao: apiario.descricao || ''
      });
    } else {
      setEditingApiario(null);
      setFormData({
        nome: '',
        localizacao: '',
        responsavel: '',
        descricao: ''
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
    setSavingApiario(true);
    
    try {
      if (editingApiario) {
        await api.put(`/apiarios/${editingApiario.id}`, formData);
      } else {
        await api.post('/apiarios', formData);
      }
      
      handleModalClose();
      fetchApiarios();
    } catch (error) {
      console.error('Erro ao salvar apiário:', error);
      setError(`Erro ao ${editingApiario ? 'atualizar' : 'cadastrar'} o apiário. Tente novamente.`);
    } finally {
      setSavingApiario(false);
    }
  };
  
  const handleShowStats = async (apiario) => {
    setSelectedApiario(apiario);
    setLoadingStats(true);
    
    try {
      const response = await api.get(`/apiarios/${apiario.id}/stats`);
      setApiarioStats(response.data);
      setShowStatsModal(true);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setError('Erro ao carregar estatísticas do apiário.');
    } finally {
      setLoadingStats(false);
    }
  };
  
  const handleCloseStats = () => {
    setShowStatsModal(false);
    setSelectedApiario(null);
    setApiarioStats(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este apiário? Isso pode afetar colmeias associadas.')) {
      try {
        await api.delete(`/apiarios/${id}`);
        setApiarios(apiarios.filter(apiario => apiario.id !== id));
      } catch (error) {
        console.error('Erro ao excluir apiário:', error);
        setError('Erro ao excluir o apiário. Verifique se não há colmeias vinculadas.');
      }
    }
  };
  
  const handleViewColmeias = (apiarioId) => {
    navigate(`/colmeias?apiario=${apiarioId}`);
  };

  const filteredApiarios = apiarios.filter(apiario => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      apiario.nome.toLowerCase().includes(searchTermLower) ||
      apiario.localizacao.toLowerCase().includes(searchTermLower) ||
      (apiario.responsavel && apiario.responsavel.toLowerCase().includes(searchTermLower))
    );
  });

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
        <p className="mt-2">Carregando apiários...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap mb-4">
        <h2 className="mb-2 mb-md-0 main-title">Gerenciamento de Apiários</h2>
        <Button onClick={() => handleModalShow()} variant="primary">
          <i className="fas fa-plus me-2"></i>Novo Apiário
        </Button>
      </div>
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          <i className="fas fa-exclamation-circle me-2"></i>{error}
        </Alert>
      )}
      
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center flex-wrap">
          <h5 className="mb-0 me-2"><i className="fas fa-leaf me-2"></i>Apiários Cadastrados</h5>
          <small className="text-muted">{filteredApiarios.length} apiários encontrados</small>
        </Card.Header>
        <Card.Body>
          <InputGroup className="mb-3">
            <InputGroup.Text>
              <i className="fas fa-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar por nome, localização ou responsável..."
              value={searchTerm}
              onChange={handleSearch}
              aria-label="Buscar"
            />
          </InputGroup>
          
          {filteredApiarios.length === 0 ? (
            <Alert variant="info">
              <i className="fas fa-info-circle me-2"></i>Nenhum apiário encontrado.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Localização</th>
                    <th>Responsável</th>
                    <th className="text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApiarios.map(apiario => (
                    <tr key={apiario.id}>
                      <td>
                        <strong>{apiario.nome}</strong>
                      </td>
                      <td>{apiario.localizacao}</td>
                      <td>{apiario.responsavel || '-'}</td>
                      <td>
                        <div className="d-flex justify-content-center gap-1">
                          <Button 
                            variant="outline-info" 
                            size="sm"
                            onClick={() => handleShowStats(apiario)}
                            title="Ver estatísticas"
                          >
                            <i className="fas fa-chart-pie"></i>
                          </Button>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => handleViewColmeias(apiario.id)}
                            title="Ver colmeias"
                          >
                            <i className="fas fa-home"></i>
                          </Button>
                          <Button 
                            variant="outline-warning" 
                            size="sm"
                            onClick={() => handleModalShow(apiario)}
                            title="Editar apiário"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDelete(apiario.id)}
                            title="Excluir apiário"
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
          Total de apiários: {filteredApiarios.length}
        </Card.Footer>
      </Card>
      
      {/* Modal para Cadastro/Edição */}
      <Modal show={showModal} onHide={handleModalClose} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingApiario ? 'Editar Apiário' : 'Novo Apiário'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nome do Apiário</Form.Label>
              <Form.Control
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                placeholder="Digite o nome do apiário"
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
                placeholder="Digite a localização do apiário"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Responsável</Form.Label>
              <Form.Control
                type="text"
                name="responsavel"
                value={formData.responsavel}
                onChange={handleInputChange}
                placeholder="Nome do responsável pelo apiário"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Descrição</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                placeholder="Descrição ou observações sobre o apiário"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={handleModalClose}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={savingApiario}>
              {savingApiario ? (
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
      
      {/* Modal de Estatísticas */}
      <Modal show={showStatsModal} onHide={handleCloseStats} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-chart-pie me-2"></i>
            Estatísticas: {selectedApiario?.nome}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingStats ? (
            <div className="text-center my-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
              <p className="mt-2">Carregando estatísticas...</p>
            </div>
          ) : apiarioStats ? (
            <>
              <Row className="mb-4">
                <Col md={12}>
                  <h5 className="border-bottom pb-2 mb-3">Status das Colmeias</h5>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {apiarioStats.statusColmeias.map((status, index) => (
                      <Badge key={index} bg={
                        status.status === 'Ativa' ? 'success' :
                        status.status === 'Em manutenção' ? 'warning' :
                        status.status === 'Inativa' ? 'danger' : 'secondary'
                      } className="p-2 fs-6">
                        {status.status}: {status.count}
                      </Badge>
                    ))}
                  </div>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <h5 className="border-bottom pb-2 mb-3">Últimos Monitoramentos</h5>
                  {apiarioStats.monitoramentoRecente.length === 0 ? (
                    <Alert variant="info">Nenhum monitoramento registrado.</Alert>
                  ) : (
                    <div className="table-responsive">
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
                          {apiarioStats.monitoramentoRecente.slice(0, 5).map((item, index) => (
                            <tr key={index}>
                              <td>{new Date(item.data_hora).toLocaleDateString('pt-BR')}</td>
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
                </Col>
                
                <Col md={6}>
                  <h5 className="border-bottom pb-2 mb-3">Alertas Recentes</h5>
                  {apiarioStats.alertasRecentes.length === 0 ? (
                    <Alert variant="info">Nenhum alerta registrado.</Alert>
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
                          {apiarioStats.alertasRecentes.map((alerta, index) => (
                            <tr key={index}>
                              <td>{new Date(alerta.data_hora).toLocaleDateString('pt-BR')}</td>
                              <td>{alerta.descricao_alerta}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Col>
              </Row>
            </>
          ) : (
            <Alert variant="warning">Não foi possível carregar estatísticas.</Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => handleViewColmeias(selectedApiario.id)}>
            <i className="fas fa-home me-1"></i> Ver Colmeias
          </Button>
          <Button variant="secondary" onClick={handleCloseStats}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ListaApiarios;
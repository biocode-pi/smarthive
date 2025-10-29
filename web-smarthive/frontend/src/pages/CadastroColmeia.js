import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const CadastroColmeia = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    nome: '',
    localizacao: '',
    status: '',
    apiario_id: ''
  });

  const [apiarios, setApiarios] = useState([]);
  const [loadingApiarios, setLoadingApiarios] = useState(true);

  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditing);

  useEffect(() => {
    // Fetch apiaries
    const fetchApiarios = async () => {
      try {
        const response = await api.get('/apiarios');
        setApiarios(response.data);
      } catch (error) {
        console.error('Erro ao buscar apiários:', error);
      } finally {
        setLoadingApiarios(false);
      }
    };

    fetchApiarios();
    
    if (isEditing) {
      const fetchColmeia = async () => {
        try {
          const response = await api.get(`/colmeias/${id}`);
          setFormData({
            nome: response.data.nome,
            localizacao: response.data.localizacao,
            status: response.data.status,
            apiario_id: response.data.apiario_id || ''
          });
        } catch (error) {
          console.error('Erro ao buscar colmeia:', error);
          setMessage({ 
            text: 'Erro ao carregar dados da colmeia.', 
            type: 'danger' 
          });
        } finally {
          setLoadingData(false);
        }
      };

      fetchColmeia();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isEditing) {
        await api.put(`/colmeias/${id}`, formData);
        setMessage({ 
          text: 'Colmeia atualizada com sucesso!', 
          type: 'success' 
        });
      } else {
        await api.post('/colmeias', formData);
        setMessage({ 
          text: 'Colmeia cadastrada com sucesso!', 
          type: 'success' 
        });
        
        // Limpar o formulário após cadastro
        setFormData({
          nome: '',
          localizacao: '',
          status: '',
          apiario_id: ''
        });
      }
      
      // Redirecionar para a lista após 2 segundos
      setTimeout(() => {
        navigate('/colmeias');
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao salvar colmeia:', error);
      setMessage({ 
        text: `Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} a colmeia. Tente novamente.`, 
        type: 'danger' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
        <p className="mt-2">Carregando dados da colmeia...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-center mb-4 main-title">
        {isEditing ? 'Editar Colmeia' : 'Cadastro de Colmeia'}
      </h2>
      
      {message.text && (
        <Alert variant={message.type} dismissible onClose={() => setMessage({ text: '', type: '' })}>
          {message.text}
        </Alert>
      )}
      
      <Card>
        <Card.Header>{isEditing ? 'Editar Dados' : 'Nova Colmeia'}</Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formNome">
              <Form.Label>Nome da Colmeia</Form.Label>
              <Form.Control
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Digite o nome da colmeia"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formLocalizacao">
              <Form.Label>Localização</Form.Label>
              <Form.Control
                type="text"
                name="localizacao"
                value={formData.localizacao}
                onChange={handleChange}
                placeholder="Digite a localização da colmeia"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formStatus">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="">Selecione o status</option>
                <option value="Ativa">Ativa</option>
                <option value="Em manutenção">Em manutenção</option>
                <option value="Inativa">Inativa</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formApiario">
              <Form.Label>Apiário</Form.Label>
              <Form.Select
                name="apiario_id"
                value={formData.apiario_id}
                onChange={handleChange}
                disabled={loadingApiarios}
              >
                <option value="">Selecione o apiário</option>
                {apiarios.map(apiario => (
                  <option key={apiario.id} value={apiario.id}>
                    {apiario.nome} - {apiario.localizacao}
                  </option>
                ))}
              </Form.Select>
              {loadingApiarios ? (
                <Form.Text className="text-muted">Carregando apiários...</Form.Text>
              ) : (
                <Form.Text className="text-muted">
                  Selecione o apiário ao qual esta colmeia pertence
                </Form.Text>
              )}
            </Form.Group>

            <div className="d-flex justify-content-between">
              <Button variant="secondary" onClick={() => navigate('/colmeias')}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Salvar')}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CadastroColmeia;
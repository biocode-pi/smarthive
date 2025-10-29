import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import api from '../services/api';

const CadastroMonitoramento = () => {
  const [formData, setFormData] = useState({
    data_hora: '',
    numero_abelhas: '',
    temperatura: '',
    clima: '',
    situacao: '',
    observacoes: '',
    colmeia_id: '',
    predator_detected: false,
    predator_type: ''
  });

  const [colmeias, setColmeias] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [loadingColmeias, setLoadingColmeias] = useState(true);

  useEffect(() => {
    const fetchColmeias = async () => {
      try {
        const response = await api.get('/colmeias');
        setColmeias(response.data);
      } catch (error) {
        console.error('Erro ao buscar colmeias:', error);
      } finally {
        setLoadingColmeias(false);
      }
    };

    fetchColmeias();
  }, []);

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
      // Post monitoring data first
      const monitoringResponse = await api.post('/monitoramento', formData);
      
      // If predator detected, create an alert
      if (formData.predator_detected && formData.predator_type) {
        await api.post('/alertas', {
          colmeia_id: formData.colmeia_id,
          descricao_alerta: `Predador detectado: ${formData.predator_type}. ${formData.observacoes ? 'Observações: ' + formData.observacoes : ''}`,
          data_hora: formData.data_hora
        });
      }
      
      // Update notification count in localStorage
      const currentCount = parseInt(localStorage.getItem('notificationCount') || '0');
      localStorage.setItem('notificationCount', (currentCount + 1).toString());
      // Dispatch a custom event for real-time notification updates
      window.dispatchEvent(new CustomEvent('newNotification'));
      
      setMessage({ 
        text: 'Registro de monitoramento cadastrado com sucesso!', 
        type: 'success' 
      });
      
      // Limpar o formulário
      setFormData({
        data_hora: '',
        numero_abelhas: '',
        temperatura: '',
        clima: '',
        situacao: '',
        observacoes: '',
        colmeia_id: '',
        predator_detected: false,
        predator_type: ''
      });
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      setMessage({ 
        text: 'Erro ao cadastrar o monitoramento. Tente novamente.', 
        type: 'danger' 
      });
    } finally {
      setLoading(false);
      
      // Limpar a mensagem após 5 segundos
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 5000);
    }
  };

  return (
    <div>
      <h2 className="text-center mb-4 main-title">Cadastro de Monitoramento</h2>
      
      {message.text && (
        <Alert variant={message.type} dismissible onClose={() => setMessage({ text: '', type: '' })}>
          {message.text}
        </Alert>
      )}
      
      <Card>
        <Card.Header>Novo Registro</Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formDataHora">
              <Form.Label>Data e Hora</Form.Label>
              <Form.Control
                type="datetime-local"
                name="data_hora"
                value={formData.data_hora}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formNumeroAbelhas">
              <Form.Label>Número de Abelhas</Form.Label>
              <Form.Control
                type="number"
                name="numero_abelhas"
                value={formData.numero_abelhas}
                onChange={handleChange}
                placeholder="Quantidade de abelhas observadas"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formTemperatura">
              <Form.Label>Temperatura (°C)</Form.Label>
              <Form.Control
                type="number"
                step="0.1"
                name="temperatura"
                value={formData.temperatura}
                onChange={handleChange}
                placeholder="Ex: 25.5"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formClima">
              <Form.Label>Clima</Form.Label>
              <Form.Select
                name="clima"
                value={formData.clima}
                onChange={handleChange}
                required
              >
                <option value="">Selecione o clima</option>
                <option value="Ensolarado">Ensolarado</option>
                <option value="Nublado">Nublado</option>
                <option value="Chuvoso">Chuvoso</option>
                <option value="Parcialmente nublado">Parcialmente nublado</option>
                <option value="Tempestuoso">Tempestuoso</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formSituacao">
              <Form.Label>Situação</Form.Label>
              <Form.Select
                name="situacao"
                value={formData.situacao}
                onChange={handleChange}
                required
              >
                <option value="">Selecione a situação</option>
                <option value="Normal">Normal</option>
                <option value="Alerta">Alerta</option>
                <option value="Crítico">Crítico</option>
                <option value="Em observação">Em observação</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formObservacoes">
              <Form.Label>Observações</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                placeholder="Observações adicionais (opcional)"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formColmeia">
              <Form.Label>Colmeia</Form.Label>
              <Form.Select
                name="colmeia_id"
                value={formData.colmeia_id}
                onChange={handleChange}
                disabled={loadingColmeias}
                required
              >
                <option value="">Selecione a colmeia</option>
                {colmeias.map(colmeia => (
                  <option key={colmeia.id} value={colmeia.id}>
                    {colmeia.nome} - {colmeia.localizacao}
                  </option>
                ))}
              </Form.Select>
              {loadingColmeias && <Form.Text className="text-muted">Carregando colmeias...</Form.Text>}
            </Form.Group>

            <hr className="my-4" />
            
            <Form.Group className="mb-3" controlId="formPredatorDetection">
              <Form.Label>Detecção de Predadores</Form.Label>
              <Form.Check
                type="checkbox"
                id="predator-checkbox"
                label="Predador detectado na colmeia"
                name="predator_detected"
                checked={formData.predator_detected}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    predator_detected: e.target.checked
                  });
                }}
                className="mb-3"
              />
            </Form.Group>

            {formData.predator_detected && (
              <Form.Group className="mb-3" controlId="formPredatorType">
                <Form.Label>Tipo de Predador</Form.Label>
                <Form.Select
                  name="predator_type"
                  value={formData.predator_type}
                  onChange={handleChange}
                  required={formData.predator_detected}
                >
                  <option value="">Selecione o tipo de predador</option>
                  <option value="Formigas">Formigas</option>
                  <option value="Aranhas">Aranhas</option>
                  <option value="Vespas">Vespas</option>
                  <option value="Pássaros">Pássaros</option>
                  <option value="Lagartos">Lagartos</option>
                  <option value="Outros">Outros</option>
                </Form.Select>
              </Form.Group>
            )}
            
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CadastroMonitoramento;
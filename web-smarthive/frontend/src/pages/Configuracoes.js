import React, { useState } from 'react';
import { Card, Form, Button, Row, Col, Alert, Tabs, Tab } from 'react-bootstrap';

const Configuracoes = () => {
  const [activeTab, setActiveTab] = useState('sistema');
  const [alertaSettings, setAlertaSettings] = useState({
    tempMin: 18,
    tempMax: 35,
    numAbelhMin: 50
  });
  const [notificacoesSettings, setNotificacoesSettings] = useState({
    emailAlertas: true,
    emailDiario: false,
    emailRecipient: ''
  });
  
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleAlertaChange = (e) => {
    const { name, value } = e.target;
    setAlertaSettings({
      ...alertaSettings,
      [name]: value
    });
  };

  const handleNotificacoesChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNotificacoesSettings({
      ...notificacoesSettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmitAlertas = (e) => {
    e.preventDefault();
    // Simulação de salvamento (em uma aplicação real, enviaria para a API)
    setMessage({
      text: 'Configurações de alerta salvas com sucesso!',
      type: 'success'
    });
    
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 3000);
  };

  const handleSubmitNotificacoes = (e) => {
    e.preventDefault();
    // Simulação de salvamento (em uma aplicação real, enviaria para a API)
    setMessage({
      text: 'Configurações de notificação salvas com sucesso!',
      type: 'success'
    });
    
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 3000);
  };

  return (
    <div>
      <h2 className="text-center mb-4 main-title">Configurações</h2>
      
      {message.text && (
        <Alert variant={message.type} dismissible onClose={() => setMessage({ text: '', type: '' })}>
          {message.text}
        </Alert>
      )}
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-3"
      >
        <Tab eventKey="sistema" title="Sistema">
          <Card>
            <Card.Header>Configurações do Sistema</Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmitAlertas}>
                <h5 className="mb-3">Parâmetros para Alertas</h5>
                
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group controlId="tempMin">
                      <Form.Label>Temperatura Mínima (°C)</Form.Label>
                      <Form.Control
                        type="number"
                        name="tempMin"
                        value={alertaSettings.tempMin}
                        onChange={handleAlertaChange}
                      />
                      <Form.Text className="text-muted">
                        Alertas serão gerados quando a temperatura for menor que este valor
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group controlId="tempMax">
                      <Form.Label>Temperatura Máxima (°C)</Form.Label>
                      <Form.Control
                        type="number"
                        name="tempMax"
                        value={alertaSettings.tempMax}
                        onChange={handleAlertaChange}
                      />
                      <Form.Text className="text-muted">
                        Alertas serão gerados quando a temperatura for maior que este valor
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3" controlId="numAbelhMin">
                  <Form.Label>Número Mínimo de Abelhas</Form.Label>
                  <Form.Control
                    type="number"
                    name="numAbelhMin"
                    value={alertaSettings.numAbelhMin}
                    onChange={handleAlertaChange}
                  />
                  <Form.Text className="text-muted">
                    Alertas serão gerados quando o número de abelhas for menor que este valor
                  </Form.Text>
                </Form.Group>
                
                <Button variant="primary" type="submit">
                  Salvar Configurações
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="notificacoes" title="Notificações">
          <Card>
            <Card.Header>Configurações de Notificações</Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmitNotificacoes}>
                <Form.Group className="mb-3" controlId="emailRecipient">
                  <Form.Label>E-mail para Notificações</Form.Label>
                  <Form.Control
                    type="email"
                    name="emailRecipient"
                    value={notificacoesSettings.emailRecipient}
                    onChange={handleNotificacoesChange}
                    placeholder="seu@email.com"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="emailAlertas">
                  <Form.Check
                    type="checkbox"
                    label="Receber alertas por e-mail"
                    name="emailAlertas"
                    checked={notificacoesSettings.emailAlertas}
                    onChange={handleNotificacoesChange}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="emailDiario">
                  <Form.Check
                    type="checkbox"
                    label="Receber relatório diário por e-mail"
                    name="emailDiario"
                    checked={notificacoesSettings.emailDiario}
                    onChange={handleNotificacoesChange}
                  />
                </Form.Group>
                
                <Button variant="primary" type="submit">
                  Salvar Configurações
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

export default Configuracoes;
import React from 'react';
import { Card, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      <h1 className="text-center mb-4 main-title">Sistema de Monitoramento de Abelhas Nativas</h1>
      
      <Row className="mt-5">
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Cadastrar Monitoramento</h5>
            </Card.Header>
            <Card.Body>
              <Card.Text>
                Registre uma nova observação de abelhas nativas, incluindo número de abelhas, 
                temperatura, condições climáticas e outras informações relevantes.
              </Card.Text>
              <Button as={Link} to="/cadastro" variant="primary">Cadastrar</Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>
              <h5 className="mb-0">Lista de Monitoramentos</h5>
            </Card.Header>
            <Card.Body>
              <Card.Text>
                Visualize todos os registros de monitoramento de abelhas cadastrados no sistema,
                organizados por data e horário.
              </Card.Text>
              <Button as={Link} to="/lista" variant="primary">Visualizar</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card className="mt-4">
        <Card.Header>
          <h5 className="mb-0">Sobre o Projeto</h5>
        </Card.Header>
        <Card.Body>
          <Card.Text>
            Este sistema permite o monitoramento de abelhas nativas, ajudando na preservação e 
            no estudo desses importantes polinizadores. Os dados coletados podem ser usados para 
            análises de comportamento, saúde das colônias e impactos ambientais.
          </Card.Text>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Home;


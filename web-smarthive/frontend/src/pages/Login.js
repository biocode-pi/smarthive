import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import api from '../services/api';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/login', formData);
      
      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('isAuthenticated', 'true');
        onLogin();
      } else {
        setError('Credenciais inválidas. Por favor, tente novamente.');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro no login. Verifique suas credenciais ou a conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="text-center mb-4 pt-5">
          <div className="login-logo">
            <i className="fas fa-hexagon"></i>
          </div>
          <h2 className="mt-3 login-title">Smart Hive</h2>
          <p className="text-muted">Sistema de Monitoramento de Abelhas Nativas</p>
        </div>
        
        <div className="login-body">
          {error && (
            <Alert variant="danger" className="mb-4">
              <i className="fas fa-exclamation-circle me-2"></i>{error}
            </Alert>
          )}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4" controlId="formUsername">
              <Form.Label className="fw-medium text-dark">Usuário</Form.Label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="fas fa-user text-primary"></i>
                </span>
                <Form.Control
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Digite seu usuário"
                  required
                  autoFocus
                  className="border-start-0 py-2 shadow-none"
                />
              </div>
            </Form.Group>

            <Form.Group className="mb-4" controlId="formPassword">
              <Form.Label className="fw-medium text-dark">Senha</Form.Label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="fas fa-lock text-primary"></i>
                </span>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Digite sua senha"
                  required
                  className="border-start-0 py-2 shadow-none"
                />
              </div>
            </Form.Group>

            <div className="d-grid mb-4">
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading}
                className="py-2 rounded-pill shadow-sm"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Entrando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt me-2"></i>
                    Entrar
                  </>
                )}
              </Button>
            </div>
            
            <div className="text-center text-muted">
              <small>Para teste: Usuário: <code>admin</code>, Senha: <code>admin</code></small>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Login;
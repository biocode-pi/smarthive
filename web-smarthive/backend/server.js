const express = require('express');
const cors = require('cors');
const monitoramentoRoutes = require('./routes/monitoramentoRoutes');
const colmeiaRoutes = require('./routes/colmeiaRoutes');
const alertaRoutes = require('./routes/alertaRoutes');
const authRoutes = require('./routes/authRoutes');
const apiarioRoutes = require('./routes/apiarioRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/monitoramento', monitoramentoRoutes);
app.use('/api/colmeias', colmeiaRoutes);
app.use('/api/alertas', alertaRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/apiarios', apiarioRoutes);

app.get('/', (req, res) => {
  res.send('API do Sistema de Monitoramento de Abelhas Nativas');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
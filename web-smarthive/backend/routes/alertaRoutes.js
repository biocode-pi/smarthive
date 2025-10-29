const express = require('express');
const router = express.Router();
const alertaController = require('../controllers/alertaController');

// Obter todos os alertas
router.get('/', alertaController.getAll);

// Obter um alerta específico
router.get('/:id', alertaController.getById);

// Criar novo alerta
router.post('/', alertaController.create);

// Excluir alerta
router.delete('/:id', alertaController.delete);

module.exports = router;


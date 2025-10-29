const express = require('express');
const router = express.Router();
const monitoramentoController = require('../controllers/monitoramentoController');

// Obter todos os registros
router.get('/', monitoramentoController.getAll);

// Obter um registro específico
router.get('/:id', monitoramentoController.getById);

// Criar novo registro
router.post('/', monitoramentoController.create);

// Atualizar registro
router.put('/:id', monitoramentoController.update);

// Excluir registro
router.delete('/:id', monitoramentoController.delete);

module.exports = router;


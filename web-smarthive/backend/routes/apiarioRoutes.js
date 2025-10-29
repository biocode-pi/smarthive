const express = require('express');
const router = express.Router();
const apiarioController = require('../controllers/apiarioController');

// Obter todos os apiários
router.get('/', apiarioController.getAll);

// Obter um apiário específico
router.get('/:id', apiarioController.getById);

// Criar novo apiário
router.post('/', apiarioController.create);

// Atualizar apiário
router.put('/:id', apiarioController.update);

// Excluir apiário
router.delete('/:id', apiarioController.delete);

// Obter colmeias de um apiário
router.get('/:id/colmeias', apiarioController.getColmeias);

// Obter estatísticas do apiário
router.get('/:id/stats', apiarioController.getStats);

module.exports = router;


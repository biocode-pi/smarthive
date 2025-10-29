const express = require('express');
const router = express.Router();
const colmeiaController = require('../controllers/colmeiaController');

// Obter todas as colmeias
router.get('/', colmeiaController.getAll);

// Obter uma colmeia específica
router.get('/:id', colmeiaController.getById);

// Criar nova colmeia
router.post('/', colmeiaController.create);

// Atualizar colmeia
router.put('/:id', colmeiaController.update);

// Excluir colmeia
router.delete('/:id', colmeiaController.delete);

// Obter monitoramentos de uma colmeia
router.get('/:id/monitoramentos', colmeiaController.getMonitoramentos);

// Obter alertas de uma colmeia
router.get('/:id/alertas', colmeiaController.getAlertas);

// Obter predadores detectados em uma colmeia
router.get('/:id/predators', colmeiaController.getPredators);

module.exports = router;
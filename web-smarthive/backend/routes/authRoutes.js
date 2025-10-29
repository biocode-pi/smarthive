const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rota de login
router.post('/login', authController.login);

// Rota para obter perfil do usuário
router.get('/profile/:id', authController.getProfile);

module.exports = router;
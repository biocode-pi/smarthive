const db = require('../config/db');

const authController = {
  login: async (req, res) => {
    const { username, password } = req.body;
    
    try {
      // For simplicity, we're checking plain text passwords
      // In a real system, you should use proper password hashing
      const [users] = await db.query(
        'SELECT id, username, role, nome_completo FROM usuarios WHERE username = ? AND password = ?',
        [username, password]
      );
      
      if (users.length > 0) {
        // Atualizar último login
        await db.query(
          'UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?',
          [users[0].id]
        );
        
        res.json({
          success: true,
          user: {
            id: users[0].id,
            username: users[0].username,
            role: users[0].role,
            nome: users[0].nome_completo
          },
          message: 'Login realizado com sucesso'
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Usuário ou senha inválidos'
        });
      }
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno no servidor'
      });
    }
  },
  
  // Obter dados do usuário atual
  getProfile: async (req, res) => {
    try {
      const { id } = req.params;
      
      const [users] = await db.query(
        'SELECT id, username, nome_completo, email, role, ultimo_login FROM usuarios WHERE id = ?',
        [id]
      );
      
      if (users.length === 0) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      
      res.json(users[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao buscar perfil do usuário' });
    }
  }
};

module.exports = authController;
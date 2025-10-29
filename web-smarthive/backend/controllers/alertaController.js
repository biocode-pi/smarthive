const db = require('../config/db');

const alertaController = {
  // Obter todos os alertas
  getAll: async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT a.*, c.nome as nome_colmeia 
        FROM alertas a 
        JOIN colmeias c ON a.colmeia_id = c.id 
        ORDER BY a.data_hora DESC
      `);
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao buscar alertas' });
    }
  },

  // Obter um alerta específico
  getById: async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT a.*, c.nome as nome_colmeia 
        FROM alertas a 
        JOIN colmeias c ON a.colmeia_id = c.id 
        WHERE a.id = ?
      `, [req.params.id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Alerta não encontrado' });
      }
      
      res.json(rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao buscar alerta' });
    }
  },

  // Criar novo alerta
  create: async (req, res) => {
    try {
      const { colmeia_id, descricao_alerta, data_hora } = req.body;
      
      // Verificar se a colmeia existe
      const [colmeias] = await db.query('SELECT id FROM colmeias WHERE id = ?', [colmeia_id]);
      if (colmeias.length === 0) {
        return res.status(404).json({ message: 'Colmeia não encontrada' });
      }
      
      const [result] = await db.query(
        'INSERT INTO alertas (colmeia_id, descricao_alerta, data_hora) VALUES (?, ?, ?)',
        [colmeia_id, descricao_alerta, data_hora]
      );
      
      res.status(201).json({
        id: result.insertId,
        message: 'Alerta criado com sucesso'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao criar alerta' });
    }
  },

  // Excluir alerta
  delete: async (req, res) => {
    try {
      const [result] = await db.query('DELETE FROM alertas WHERE id = ?', [req.params.id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Alerta não encontrado' });
      }
      
      res.json({ message: 'Alerta excluído com sucesso' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao excluir alerta' });
    }
  }
};

module.exports = alertaController;
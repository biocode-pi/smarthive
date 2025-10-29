const db = require('../config/db');

const apiarioController = {
  // Obter todos os apiários
  getAll: async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM apiarios ORDER BY nome');
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao buscar apiários' });
    }
  },

  // Obter um apiário específico
  getById: async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM apiarios WHERE id = ?', [req.params.id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Apiário não encontrado' });
      }
      
      res.json(rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao buscar apiário' });
    }
  },

  // Criar novo apiário
  create: async (req, res) => {
    try {
      const { nome, localizacao, responsavel, descricao } = req.body;
      
      const [result] = await db.query(
        'INSERT INTO apiarios (nome, localizacao, responsavel, descricao) VALUES (?, ?, ?, ?)',
        [nome, localizacao, responsavel, descricao]
      );
      
      res.status(201).json({
        id: result.insertId,
        message: 'Apiário criado com sucesso'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao criar apiário' });
    }
  },

  // Atualizar apiário
  update: async (req, res) => {
    try {
      const { nome, localizacao, responsavel, descricao } = req.body;
      
      const [result] = await db.query(
        'UPDATE apiarios SET nome = ?, localizacao = ?, responsavel = ?, descricao = ? WHERE id = ?',
        [nome, localizacao, responsavel, descricao, req.params.id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Apiário não encontrado' });
      }
      
      res.json({ message: 'Apiário atualizado com sucesso' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao atualizar apiário' });
    }
  },

  // Excluir apiário
  delete: async (req, res) => {
    try {
      const [result] = await db.query('DELETE FROM apiarios WHERE id = ?', [req.params.id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Apiário não encontrado' });
      }
      
      res.json({ message: 'Apiário excluído com sucesso' });
    }
    catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao excluir apiário' });
    }
  },
  
  // Obter colmeias de um apiário específico
  getColmeias: async (req, res) => {
    try {
      const [rows] = await db.query(
        'SELECT c.*, a.nome as apiario_nome FROM colmeias c LEFT JOIN apiarios a ON c.apiario_id = a.id WHERE c.apiario_id = ?',
        [req.params.id]
      );
      
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao buscar colmeias do apiário' });
    }
  },
  
  // Obter estatísticas do apiário
  getStats: async (req, res) => {
    try {
      // Obtém contagem de colmeias por status
      const [statusStats] = await db.query(`
        SELECT status, COUNT(*) as count 
        FROM colmeias 
        WHERE apiario_id = ? 
        GROUP BY status
      `, [req.params.id]);
      
      // Obtém dados de monitoramento recentes deste apiário
      const [monitoramentoRecente] = await db.query(`
        SELECT m.* 
        FROM monitoramento_abelhas m
        JOIN colmeias c ON m.colmeia_id = c.id
        WHERE c.apiario_id = ?
        ORDER BY m.data_hora DESC
        LIMIT 10
      `, [req.params.id]);
      
      // Obtém alertas recentes deste apiário
      const [alertasRecentes] = await db.query(`
        SELECT a.* 
        FROM alertas a
        JOIN colmeias c ON a.colmeia_id = c.id
        WHERE c.apiario_id = ?
        ORDER BY a.data_hora DESC
        LIMIT 5
      `, [req.params.id]);
      
      res.json({
        statusColmeias: statusStats,
        monitoramentoRecente,
        alertasRecentes
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao buscar estatísticas do apiário' });
    }
  }
};

module.exports = apiarioController;
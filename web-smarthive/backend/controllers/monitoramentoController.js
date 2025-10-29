const db = require('../config/db');

// Controlador para manipulação dos dados de monitoramento
const monitoramentoController = {
  // Obter todos os registros
  getAll: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : null;
      const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
      const endDate = req.query.endDate ? new Date(req.query.endDate + 'T23:59:59.999Z') : null;
      
      let query = `
        SELECT m.*, c.nome as nome_colmeia 
        FROM monitoramento_abelhas m 
        LEFT JOIN colmeias c ON m.colmeia_id = c.id 
      `;
      
      // Add date filters if provided
      const whereConditions = [];
      const queryParams = [];
      
      if (startDate) {
        whereConditions.push('m.data_hora >= ?');
        queryParams.push(startDate);
      }
      
      if (endDate) {
        whereConditions.push('m.data_hora <= ?');
        queryParams.push(endDate);
      }
      
      if (whereConditions.length > 0) {
        query += ' WHERE ' + whereConditions.join(' AND ');
      }
      
      query += ' ORDER BY m.data_hora DESC';
      
      if (limit) {
        query += ' LIMIT ?';
        queryParams.push(limit);
      }
      
      const [rows] = await db.query(query, queryParams);
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao buscar registros' });
    }
  },

  // Obter um registro específico
  getById: async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT m.*, c.nome as nome_colmeia 
        FROM monitoramento_abelhas m 
        LEFT JOIN colmeias c ON m.colmeia_id = c.id 
        WHERE m.id = ?
      `, [req.params.id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Registro não encontrado' });
      }
      
      res.json(rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao buscar registro' });
    }
  },

  // Criar novo registro
  create: async (req, res) => {
    try {
      const { data_hora, numero_abelhas, temperatura, clima, situacao, observacoes, colmeia_id } = req.body;
      
      // Verificar se a colmeia existe se um id foi fornecido
      if (colmeia_id) {
        const [colmeias] = await db.query('SELECT id FROM colmeias WHERE id = ?', [colmeia_id]);
        if (colmeias.length === 0) {
          return res.status(404).json({ message: 'Colmeia não encontrada' });
        }
      }
      
      const [result] = await db.query(
        'INSERT INTO monitoramento_abelhas (data_hora, numero_abelhas, temperatura, clima, situacao, observacoes, colmeia_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [data_hora, numero_abelhas, temperatura, clima, situacao, observacoes, colmeia_id]
      );
      
      res.status(201).json({
        id: result.insertId,
        message: 'Registro de monitoramento criado com sucesso'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao criar registro' });
    }
  },

  // Atualizar registro
  update: async (req, res) => {
    try {
      const { data_hora, numero_abelhas, temperatura, clima, situacao, observacoes, colmeia_id } = req.body;
      
      // Verificar se a colmeia existe se um id foi fornecido
      if (colmeia_id) {
        const [colmeias] = await db.query('SELECT id FROM colmeias WHERE id = ?', [colmeia_id]);
        if (colmeias.length === 0) {
          return res.status(404).json({ message: 'Colmeia não encontrada' });
        }
      }
      
      const [result] = await db.query(
        'UPDATE monitoramento_abelhas SET data_hora = ?, numero_abelhas = ?, temperatura = ?, clima = ?, situacao = ?, observacoes = ?, colmeia_id = ? WHERE id = ?',
        [data_hora, numero_abelhas, temperatura, clima, situacao, observacoes, colmeia_id, req.params.id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Registro não encontrado' });
      }
      
      res.json({ message: 'Registro atualizado com sucesso' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao atualizar registro' });
    }
  },

  // Excluir registro
  delete: async (req, res) => {
    try {
      const [result] = await db.query('DELETE FROM monitoramento_abelhas WHERE id = ?', [req.params.id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Registro não encontrado' });
      }
      
      res.json({ message: 'Registro excluído com sucesso' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao excluir registro' });
    }
  }
};

module.exports = monitoramentoController;
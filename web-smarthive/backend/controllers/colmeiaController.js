const db = require('../config/db');

const colmeiaController = {
  // Obter todas as colmeias
  getAll: async (req, res) => {
    try {
      let query = 'SELECT c.*, a.nome as apiario_nome FROM colmeias c LEFT JOIN apiarios a ON c.apiario_id = a.id ORDER BY c.nome';
      
      // If there's an apiario_id filter from query params
      if (req.query.apiario_id) {
        query = 'SELECT c.*, a.nome as apiario_nome FROM colmeias c LEFT JOIN apiarios a ON c.apiario_id = a.id WHERE c.apiario_id = ? ORDER BY c.nome';
        const [rows] = await db.query(query, [req.query.apiario_id]);
        return res.json(rows);
      }
      
      const [rows] = await db.query(query);
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao buscar colmeias' });
    }
  },

  // Obter uma colmeia específica
  getById: async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM colmeias WHERE id = ?', [req.params.id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Colmeia não encontrada' });
      }
      
      res.json(rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao buscar colmeia' });
    }
  },

  // Criar nova colmeia
  create: async (req, res) => {
    try {
      const { nome, localizacao, status, apiario_id } = req.body;
      
      // Verificar se o apiário existe
      if (apiario_id) {
        const [apiarios] = await db.query('SELECT id FROM apiarios WHERE id = ?', [apiario_id]);
        if (apiarios.length === 0) {
          return res.status(404).json({ message: 'Apiário não encontrado' });
        }
      }
      
      const [result] = await db.query(
        'INSERT INTO colmeias (nome, localizacao, status, apiario_id) VALUES (?, ?, ?, ?)',
        [nome, localizacao, status, apiario_id]
      );
      
      res.status(201).json({
        id: result.insertId,
        message: 'Colmeia criada com sucesso'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao criar colmeia' });
    }
  },

  // Atualizar colmeia
  update: async (req, res) => {
    try {
      const { nome, localizacao, status, apiario_id } = req.body;
      
      // Verificar se o apiário existe
      if (apiario_id) {
        const [apiarios] = await db.query('SELECT id FROM apiarios WHERE id = ?', [apiario_id]);
        if (apiarios.length === 0) {
          return res.status(404).json({ message: 'Apiário não encontrado' });
        }
      }
      
      const [result] = await db.query(
        'UPDATE colmeias SET nome = ?, localizacao = ?, status = ?, apiario_id = ? WHERE id = ?',
        [nome, localizacao, status, apiario_id, req.params.id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Colmeia não encontrada' });
      }
      
      res.json({ message: 'Colmeia atualizada com sucesso' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao atualizar colmeia' });
    }
  },

  // Excluir colmeia
  delete: async (req, res) => {
    try {
      const [result] = await db.query('DELETE FROM colmeias WHERE id = ?', [req.params.id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Colmeia não encontrada' });
      }
      
      res.json({ message: 'Colmeia excluída com sucesso' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao excluir colmeia' });
    }
  },

  // Obter monitoramentos de uma colmeia específica
  getMonitoramentos: async (req, res) => {
    try {
      const [rows] = await db.query(
        'SELECT * FROM monitoramento_abelhas WHERE colmeia_id = ? ORDER BY data_hora DESC',
        [req.params.id]
      );
      
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao buscar monitoramentos da colmeia' });
    }
  },

  // Obter alertas de uma colmeia específica
  getAlertas: async (req, res) => {
    try {
      const [rows] = await db.query(
        'SELECT * FROM alertas WHERE colmeia_id = ? ORDER BY data_hora DESC',
        [req.params.id]
      );
      
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao buscar alertas da colmeia' });
    }
  },
  
  // Obter predadores detectados em uma colmeia específica
  getPredators: async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT pd.*, pt.nome as predator_type 
        FROM predator_detections pd
        LEFT JOIN predator_types pt ON pd.predator_type_id = pt.id
        WHERE pd.colmeia_id = ? 
        ORDER BY pd.data_hora DESC
      `, [req.params.id]);
      
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro ao buscar detecções de predadores' });
    }
  }
};

module.exports = colmeiaController;
const express = require('express');
const { body, validationResult } = require('express-validator');
const { queryAll, queryOne, runSql } = require('../database/setup');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/bugs
// Lista todos os bugs ou filtra por projectId
router.get('/', (req, res) => {
  try {
    const { projectId } = req.query;
    let sql = `
      SELECT b.*, p.name as project_name, s.name as sprint_name 
      FROM bugs b 
      JOIN projects p ON b.project_id = p.id 
      JOIN sprints s ON b.sprint_id = s.id 
      WHERE p.user_id = ?
    `;
    const params = [req.user.id];

    if (projectId) {
      sql += ' AND b.project_id = ?';
      params.push(projectId);
    }

    sql += ' ORDER BY b.created_at DESC';

    const bugs = queryAll(sql, params);
    res.json({ bugs });
  } catch (err) {
    console.error('Erro ao listar bugs:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/bugs
// Cria um novo bug
router.post('/', [
  body('project_id').isInt().withMessage('ID do projeto é obrigatório'),
  body('sprint_id').isInt().withMessage('ID do sprint é obrigatório'),
  body('description').trim().notEmpty().withMessage('Descrição é obrigatória'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { project_id, sprint_id, description, evidence_url } = req.body;

    // Verificar se o projeto pertence ao usuário
    const project = queryOne('SELECT id FROM projects WHERE id = ? AND user_id = ?', [project_id, req.user.id]);
    if (!project) return res.status(403).json({ error: 'Acesso negado ao projeto' });

    // Gerar serial number (ex: BUG-001)
    // Conta quantos bugs o projeto já tem e soma 1
    const countResult = queryOne('SELECT COUNT(*) as count FROM bugs WHERE project_id = ?', [project_id]);
    const bugNumber = (countResult.count || 0) + 1;
    const serial_number = `BUG-${String(bugNumber).padStart(3, '0')}`;

    const result = runSql(`
      INSERT INTO bugs (project_id, sprint_id, serial_number, description, evidence_url)
      VALUES (?, ?, ?, ?, ?)
    `, [project_id, sprint_id, serial_number, description, evidence_url || null]);

    const newBug = queryOne(`
      SELECT b.*, p.name as project_name, s.name as sprint_name 
      FROM bugs b 
      JOIN projects p ON b.project_id = p.id 
      JOIN sprints s ON b.sprint_id = s.id 
      WHERE b.id = ?
    `, [result.lastInsertRowid]);

    res.status(201).json({ bug: newBug });
  } catch (err) {
    console.error('Erro ao registrar bug:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

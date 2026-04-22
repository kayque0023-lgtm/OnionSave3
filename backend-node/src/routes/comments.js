const express = require('express');
const { body, validationResult } = require('express-validator');
const { queryAll, queryOne, runSql } = require('../database/setup');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/comments/project/:projectId
router.get('/project/:projectId', (req, res) => {
  try {
    const project = queryOne('SELECT * FROM projects WHERE id = ? AND user_id = ?', [req.params.projectId, req.user.id]);
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado' });

    const comments = queryAll(`
      SELECT c.*, u.name as user_name 
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.project_id = ? 
      ORDER BY c.created_at DESC
    `, [project.id]);

    res.json({ comments });
  } catch (err) {
    console.error('Erro ao listar comentários:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/comments/project/:projectId
router.post('/project/:projectId', [
  body('content').trim().notEmpty().withMessage('Conteúdo do comentário é obrigatório'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const project = queryOne('SELECT * FROM projects WHERE id = ? AND user_id = ?', [req.params.projectId, req.user.id]);
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado' });

    const result = runSql(
      'INSERT INTO comments (project_id, user_id, content) VALUES (?, ?, ?)',
      [project.id, req.user.id, req.body.content]
    );

    runSql('UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [project.id]);

    const comment = queryOne(`
      SELECT c.*, u.name as user_name 
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.id = ?
    `, [result.lastInsertRowid]);

    res.status(201).json({ comment });
  } catch (err) {
    console.error('Erro ao criar comentário:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/comments/recent
router.get('/recent', (req, res) => {
  try {
    const comments = queryAll(`
      SELECT c.*, u.name as user_name, p.name as project_name
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      JOIN projects p ON c.project_id = p.id
      WHERE p.user_id = ?
      ORDER BY c.created_at DESC
      LIMIT 10
    `, [req.user.id]);

    res.json({ comments });
  } catch (err) {
    console.error('Erro ao listar comentários recentes:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

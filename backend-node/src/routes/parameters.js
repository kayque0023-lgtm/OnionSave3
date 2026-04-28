const express = require('express');
const { body, validationResult } = require('express-validator');
const { queryAll, queryOne, runSql } = require('../database/setup');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/parameters
// Retorna todos os parâmetros agrupados por categoria
router.get('/', (req, res) => {
  try {
    const parameters = queryAll('SELECT * FROM parameters ORDER BY category, value');
    res.json({ parameters });
  } catch (err) {
    console.error('Erro ao listar parametros:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/parameters
// Apenas admins podem criar
router.post('/', requireRole('admin'), [
  body('category').isIn(['developer', 'qa', 'manager', 'client']).withMessage('Categoria inválida'),
  body('value').trim().notEmpty().withMessage('Valor não pode ser vazio')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { category, value } = req.body;

    // Verify if already exists
    const existing = queryOne('SELECT * FROM parameters WHERE category = ? AND value = ?', [category, value]);
    if (existing) {
      return res.status(400).json({ error: 'Este parâmetro já existe nesta categoria' });
    }

    const result = runSql(`
      INSERT INTO parameters (category, value)
      VALUES (?, ?)
    `, [category, value]);

    const parameter = queryOne('SELECT * FROM parameters WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ parameter });
  } catch (err) {
    console.error('Erro ao criar parametro:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/parameters/:id
// Apenas admins podem excluir
router.delete('/:id', requireRole('admin'), (req, res) => {
  try {
    const param = queryOne('SELECT * FROM parameters WHERE id = ?', [req.params.id]);
    if (!param) return res.status(404).json({ error: 'Parâmetro não encontrado' });

    runSql('DELETE FROM parameters WHERE id = ?', [req.params.id]);
    res.json({ message: 'Parâmetro excluído com sucesso' });
  } catch (err) {
    console.error('Erro ao excluir parametro:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

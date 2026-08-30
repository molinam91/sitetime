const express = require('express');
const db = require('../db');

const router = express.Router();

function today() {
  return new Date().toISOString().slice(0, 10);
}

// Alimentos registrados como "comidos" en una fecha (por defecto hoy),
// junto con el total calórico consumido.
router.get('/', (req, res) => {
  const date = req.query.date || today();
  const rows = db.prepare(`
    SELECT daily_log.id as log_id, foods.*
    FROM daily_log
    JOIN foods ON foods.id = daily_log.food_id
    WHERE daily_log.date = ?
    ORDER BY daily_log.created_at ASC
  `).all(date);

  const items = rows.map((r) => ({
    logId: r.log_id,
    id: r.id,
    name: r.name,
    category: r.category,
    calories: r.calories,
    protein: r.protein_g,
    carbs: r.carbs_g,
    fat: r.fat_g,
  }));

  const totalCalories = items.reduce((sum, f) => sum + f.calories, 0);
  res.json({ date, items, totalCalories });
});

router.post('/', (req, res) => {
  const { foodId, date } = req.body;
  if (!foodId) return res.status(400).json({ error: 'foodId es requerido.' });
  const food = db.prepare('SELECT id FROM foods WHERE id = ?').get(foodId);
  if (!food) return res.status(404).json({ error: 'Alimento no encontrado.' });

  const now = new Date().toISOString();
  const result = db.prepare('INSERT INTO daily_log (date, food_id, created_at) VALUES (?, ?, ?)')
    .run(date || today(), foodId, now);

  res.status(201).json({ logId: result.lastInsertRowid });
});

router.delete('/:logId', (req, res) => {
  db.prepare('DELETE FROM daily_log WHERE id = ?').run(req.params.logId);
  res.json({ ok: true });
});

module.exports = router;

const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM weight_history ORDER BY date ASC').all();
  res.json(rows.map((r) => ({ id: r.id, weightKg: r.weight_kg, date: r.date, note: r.note })));
});

router.post('/', (req, res) => {
  const { weightKg, date, note } = req.body;
  if (!weightKg || !date) return res.status(400).json({ error: 'weightKg y date son requeridos.' });

  const now = new Date().toISOString();
  const existing = db.prepare('SELECT id FROM weight_history WHERE date = ?').get(date);

  if (existing) {
    db.prepare('UPDATE weight_history SET weight_kg = ?, note = ? WHERE id = ?').run(weightKg, note ?? null, existing.id);
  } else {
    db.prepare('INSERT INTO weight_history (weight_kg, date, note, created_at) VALUES (?, ?, ?, ?)')
      .run(weightKg, date, note ?? null, now);
  }

  // Mantiene el peso del perfil sincronizado con el registro más reciente.
  const latest = db.prepare('SELECT weight_kg FROM weight_history ORDER BY date DESC LIMIT 1').get();
  if (latest) {
    db.prepare('UPDATE profile SET weight_kg = ?, updated_at = ? WHERE id = 1').run(latest.weight_kg, now);
  }

  const rows = db.prepare('SELECT * FROM weight_history ORDER BY date ASC').all();
  res.json(rows.map((r) => ({ id: r.id, weightKg: r.weight_kg, date: r.date, note: r.note })));
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { weightKg, date, note } = req.body;
  const existing = db.prepare('SELECT * FROM weight_history WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Registro no encontrado.' });

  db.prepare('UPDATE weight_history SET weight_kg = ?, date = ?, note = ? WHERE id = ?')
    .run(weightKg ?? existing.weight_kg, date ?? existing.date, note ?? existing.note, id);

  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM weight_history WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;

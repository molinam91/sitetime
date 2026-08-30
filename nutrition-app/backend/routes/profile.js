const express = require('express');
const db = require('../db');
const { calculateFullProfile } = require('../lib/formulas');

const router = express.Router();

function rowToProfile(row) {
  if (!row) return null;
  const calc = calculateFullProfile({
    weightKg: row.weight_kg,
    heightCm: row.height_cm,
    age: row.age,
    sex: row.sex,
    activityLevel: row.activity_level,
    goalType: row.goal_type,
    goalWeightKg: row.goal_weight_kg,
  });

  return {
    weightKg: row.weight_kg,
    heightCm: row.height_cm,
    age: row.age,
    sex: row.sex,
    activityLevel: row.activity_level,
    goalType: row.goal_type,
    goalWeightKg: row.goal_weight_kg,
    updatedAt: row.updated_at,
    ...calc,
  };
}

router.get('/', (req, res) => {
  const row = db.prepare('SELECT * FROM profile WHERE id = 1').get();
  res.json(rowToProfile(row));
});

router.put('/', (req, res) => {
  const { weightKg, heightCm, age, sex, activityLevel, goalType, goalWeightKg } = req.body;

  if (!weightKg || !heightCm || !age || !sex || !activityLevel || !goalType) {
    return res.status(400).json({ error: 'Faltan campos requeridos.' });
  }
  if (!['male', 'female'].includes(sex)) {
    return res.status(400).json({ error: 'Sexo inválido.' });
  }
  if (!['lose', 'maintain', 'gain'].includes(goalType)) {
    return res.status(400).json({ error: 'Meta inválida.' });
  }

  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO profile (id, weight_kg, height_cm, age, sex, activity_level, goal_type, goal_weight_kg, updated_at)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      weight_kg = excluded.weight_kg,
      height_cm = excluded.height_cm,
      age = excluded.age,
      sex = excluded.sex,
      activity_level = excluded.activity_level,
      goal_type = excluded.goal_type,
      goal_weight_kg = excluded.goal_weight_kg,
      updated_at = excluded.updated_at
  `).run(weightKg, heightCm, age, sex, activityLevel, goalType, goalWeightKg ?? null, now);

  // Sincroniza el peso actual con el historial de progreso.
  const today = now.slice(0, 10);
  const existingToday = db.prepare('SELECT id FROM weight_history WHERE date = ?').get(today);
  if (existingToday) {
    db.prepare('UPDATE weight_history SET weight_kg = ? WHERE id = ?').run(weightKg, existingToday.id);
  } else {
    db.prepare('INSERT INTO weight_history (weight_kg, date, note, created_at) VALUES (?, ?, ?, ?)')
      .run(weightKg, today, 'Actualizado desde perfil', now);
  }

  const row = db.prepare('SELECT * FROM profile WHERE id = 1').get();
  res.json(rowToProfile(row));
});

module.exports = router;

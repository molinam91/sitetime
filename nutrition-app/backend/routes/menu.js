const express = require('express');
const db = require('../db');
const { calculateFullProfile } = require('../lib/formulas');
const { generateDailyMenu, generateWeeklyMenu } = require('../lib/menuGenerator');

const router = express.Router();

function getFoodsByCategory() {
  const rows = db.prepare('SELECT * FROM foods WHERE disliked = 0').all();
  const byCategory = { desayuno: [], comida: [], cena: [], snack: [] };
  for (const r of rows) {
    byCategory[r.category].push({
      id: r.id,
      name: r.name,
      category: r.category,
      calories: r.calories,
      protein: r.protein_g,
      carbs: r.carbs_g,
      fat: r.fat_g,
      liked: !!r.liked,
      disliked: !!r.disliked,
    });
  }
  return byCategory;
}

function getTargetCalories() {
  const profileRow = db.prepare('SELECT * FROM profile WHERE id = 1').get();
  if (!profileRow) return null;
  const calc = calculateFullProfile({
    weightKg: profileRow.weight_kg,
    heightCm: profileRow.height_cm,
    age: profileRow.age,
    sex: profileRow.sex,
    activityLevel: profileRow.activity_level,
    goalType: profileRow.goal_type,
    goalWeightKg: profileRow.goal_weight_kg,
  });
  return calc.targetCalories;
}

router.get('/daily', (req, res) => {
  const targetCalories = getTargetCalories();
  if (!targetCalories) return res.status(400).json({ error: 'Primero completa tu perfil.' });

  const foodsByCategory = getFoodsByCategory();
  const hasAnyFood = Object.values(foodsByCategory).some((list) => list.length > 0);
  if (!hasAnyFood) return res.json({ items: { desayuno: [], comida: [], cena: [], snack: [] }, totalCalories: 0, targetCalories, empty: true });

  const menu = generateDailyMenu({ targetCalories, foodsByCategory });
  res.json({ ...menu, targetCalories });
});

router.get('/weekly', (req, res) => {
  const targetCalories = getTargetCalories();
  if (!targetCalories) return res.status(400).json({ error: 'Primero completa tu perfil.' });

  const foodsByCategory = getFoodsByCategory();
  const hasAnyFood = Object.values(foodsByCategory).some((list) => list.length > 0);
  if (!hasAnyFood) return res.json({ days: [], targetCalories, empty: true });

  const days = generateWeeklyMenu({ targetCalories, foodsByCategory });
  res.json({ days, targetCalories });
});

// Guarda una combinación de menú como favorita o la marca como no deseada
// para que deje de sugerirse en el futuro.
router.post('/favorite', (req, res) => {
  const { items, totalCalories, liked, disliked } = req.body;
  if (!items) return res.status(400).json({ error: 'items es requerido.' });

  const now = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO menu_favorites (date, items_json, total_calories, liked, disliked, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(now.slice(0, 10), JSON.stringify(items), totalCalories ?? 0, liked ? 1 : 0, disliked ? 1 : 0, now);

  res.status(201).json({ id: result.lastInsertRowid });
});

router.get('/favorites', (req, res) => {
  const rows = db.prepare('SELECT * FROM menu_favorites WHERE liked = 1 ORDER BY created_at DESC').all();
  res.json(rows.map((r) => ({
    id: r.id,
    date: r.date,
    items: JSON.parse(r.items_json),
    totalCalories: r.total_calories,
  })));
});

router.delete('/favorites/:id', (req, res) => {
  db.prepare('DELETE FROM menu_favorites WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;

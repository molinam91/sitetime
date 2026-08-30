const express = require('express');
const db = require('../db');
const { lookupReference } = require('../lib/foodReference');

const router = express.Router();

function rowToFood(r) {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    calories: r.calories,
    protein: r.protein_g,
    carbs: r.carbs_g,
    fat: r.fat_g,
    isEstimated: !!r.is_estimated,
    liked: !!r.liked,
    disliked: !!r.disliked,
  };
}

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM foods ORDER BY created_at DESC').all();
  res.json(rows.map(rowToFood));
});

// Devuelve valores nutricionales estándar sugeridos para un nombre de
// alimento, sin guardar nada (usado mientras el usuario escribe).
router.get('/estimate', (req, res) => {
  const name = req.query.name || '';
  if (!name.trim()) return res.status(400).json({ error: 'name es requerido.' });
  res.json(lookupReference(name));
});

router.post('/', (req, res) => {
  const { name, category, calories, protein, carbs, fat } = req.body;
  if (!name || !category) return res.status(400).json({ error: 'name y category son requeridos.' });
  if (!['desayuno', 'comida', 'cena', 'snack'].includes(category)) {
    return res.status(400).json({ error: 'category inválida.' });
  }

  let finalCalories = calories;
  let finalProtein = protein;
  let finalCarbs = carbs;
  let finalFat = fat;
  let estimated = false;

  if (finalCalories == null || finalCalories === '') {
    const ref = lookupReference(name);
    finalCalories = ref.calories;
    finalProtein = finalProtein ?? ref.protein;
    finalCarbs = finalCarbs ?? ref.carbs;
    finalFat = finalFat ?? ref.fat;
    estimated = true;
  }

  const now = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO foods (name, category, calories, protein_g, carbs_g, fat_g, is_estimated, liked, disliked, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
  `).run(name, category, finalCalories, finalProtein ?? 0, finalCarbs ?? 0, finalFat ?? 0, estimated ? 1 : 0, now);

  const row = db.prepare('SELECT * FROM foods WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(rowToFood(row));
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM foods WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Alimento no encontrado.' });

  const { name, category, calories, protein, carbs, fat } = req.body;

  db.prepare(`
    UPDATE foods SET name = ?, category = ?, calories = ?, protein_g = ?, carbs_g = ?, fat_g = ?, is_estimated = 0
    WHERE id = ?
  `).run(
    name ?? existing.name,
    category ?? existing.category,
    calories ?? existing.calories,
    protein ?? existing.protein_g,
    carbs ?? existing.carbs_g,
    fat ?? existing.fat_g,
    id
  );

  const row = db.prepare('SELECT * FROM foods WHERE id = ?').get(id);
  res.json(rowToFood(row));
});

router.post('/:id/like', (req, res) => {
  db.prepare('UPDATE foods SET liked = 1, disliked = 0 WHERE id = ?').run(req.params.id);
  const row = db.prepare('SELECT * FROM foods WHERE id = ?').get(req.params.id);
  res.json(rowToFood(row));
});

router.post('/:id/dislike', (req, res) => {
  db.prepare('UPDATE foods SET disliked = 1, liked = 0 WHERE id = ?').run(req.params.id);
  const row = db.prepare('SELECT * FROM foods WHERE id = ?').get(req.params.id);
  res.json(rowToFood(row));
});

router.post('/:id/unlike', (req, res) => {
  db.prepare('UPDATE foods SET liked = 0, disliked = 0 WHERE id = ?').run(req.params.id);
  const row = db.prepare('SELECT * FROM foods WHERE id = ?').get(req.params.id);
  res.json(rowToFood(row));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM foods WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;

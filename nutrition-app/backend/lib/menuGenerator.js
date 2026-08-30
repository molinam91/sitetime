// Genera menús diarios combinando los alimentos guardados por el usuario
// sin superar el total calórico calculado. Prioriza alimentos marcados
// como favoritos y excluye los marcados como "no me gusta".

const CATEGORY_BUDGET = {
  desayuno: 0.25,
  comida: 0.35,
  cena: 0.3,
  snack: 0.1,
};

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Selecciona alimentos de una categoría para llenar el presupuesto calórico
// de esa comida sin excederlo (con un pequeño margen de tolerancia).
function pickForCategory(foods, budget) {
  const usable = foods.filter((f) => !f.disliked);
  if (usable.length === 0) return [];

  const liked = shuffle(usable.filter((f) => f.liked));
  const rest = shuffle(usable.filter((f) => !f.liked));
  const ordered = [...liked, ...rest];

  const tolerance = budget * 0.2;
  const selected = [];
  let remaining = budget + tolerance;

  for (const food of ordered) {
    if (food.calories <= remaining) {
      selected.push(food);
      remaining -= food.calories;
    }
    if (remaining <= budget * 0.15) break;
  }

  // Si no cupo nada (todos muy calóricos), ofrece igual la opción más ligera.
  if (selected.length === 0) {
    const lightest = [...ordered].sort((a, b) => a.calories - b.calories)[0];
    if (lightest) selected.push(lightest);
  }

  return selected;
}

function generateDailyMenu({ targetCalories, foodsByCategory }) {
  const menu = {};
  let totalCalories = 0;

  for (const category of Object.keys(CATEGORY_BUDGET)) {
    const foods = foodsByCategory[category] || [];
    const budget = targetCalories * CATEGORY_BUDGET[category];
    const items = pickForCategory(foods, budget);
    menu[category] = items;
    totalCalories += items.reduce((sum, f) => sum + f.calories, 0);
  }

  return { items: menu, totalCalories: Math.round(totalCalories) };
}

function generateWeeklyMenu({ targetCalories, foodsByCategory }) {
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  return days.map((day) => ({ day, ...generateDailyMenu({ targetCalories, foodsByCategory }) }));
}

module.exports = { generateDailyMenu, generateWeeklyMenu, CATEGORY_BUDGET };

// Base de referencia de valores nutricionales estándar (por porción
// habitual), usada para autocompletar alimentos cuando el usuario no
// conoce sus calorías/macros exactos. Valores aproximados basados en
// tablas de composición de alimentos de uso común (USDA FoodData Central
// y bases equivalentes). El usuario siempre puede editarlos a mano.
const REFERENCE_FOODS = [
  { match: ['huevo'], calories: 78, protein: 6, carbs: 1, fat: 5 },
  { match: ['avena'], calories: 150, protein: 5, carbs: 27, fat: 3 },
  { match: ['pan integral', 'pan de caja'], calories: 90, protein: 4, carbs: 15, fat: 1 },
  { match: ['pan blanco'], calories: 80, protein: 2, carbs: 15, fat: 1 },
  { match: ['tortilla de maiz', 'tortilla de maíz'], calories: 52, protein: 1, carbs: 11, fat: 1 },
  { match: ['tortilla de harina'], calories: 140, protein: 4, carbs: 24, fat: 3 },
  { match: ['arroz'], calories: 205, protein: 4, carbs: 45, fat: 0 },
  { match: ['frijol', 'frijoles'], calories: 127, protein: 8, carbs: 23, fat: 0 },
  { match: ['pechuga de pollo', 'pollo'], calories: 165, protein: 31, carbs: 0, fat: 4 },
  { match: ['carne de res', 'res molida'], calories: 250, protein: 26, carbs: 0, fat: 17 },
  { match: ['atun', 'atún'], calories: 130, protein: 29, carbs: 0, fat: 1 },
  { match: ['salmon', 'salmón'], calories: 208, protein: 20, carbs: 0, fat: 13 },
  { match: ['queso panela'], calories: 110, protein: 9, carbs: 2, fat: 8 },
  { match: ['queso oaxaca', 'queso'], calories: 90, protein: 6, carbs: 1, fat: 7 },
  { match: ['yogur griego', 'yogurt griego'], calories: 100, protein: 10, carbs: 6, fat: 3 },
  { match: ['yogur', 'yogurt'], calories: 60, protein: 3, carbs: 5, fat: 3 },
  { match: ['leche entera'], calories: 61, protein: 3, carbs: 5, fat: 3 },
  { match: ['leche descremada', 'leche deslactosada'], calories: 35, protein: 3, carbs: 5, fat: 0 },
  { match: ['platano', 'plátano', 'banana'], calories: 105, protein: 1, carbs: 27, fat: 0 },
  { match: ['manzana'], calories: 95, protein: 0, carbs: 25, fat: 0 },
  { match: ['fresa', 'fresas'], calories: 32, protein: 1, carbs: 8, fat: 0 },
  { match: ['papaya'], calories: 43, protein: 0, carbs: 11, fat: 0 },
  { match: ['aguacate', 'palta'], calories: 160, protein: 2, carbs: 9, fat: 15 },
  { match: ['almendra', 'almendras'], calories: 164, protein: 6, carbs: 6, fat: 14 },
  { match: ['nuez', 'nueces'], calories: 185, protein: 4, carbs: 4, fat: 18 },
  { match: ['cacahuate', 'mani', 'maní'], calories: 160, protein: 7, carbs: 5, fat: 14 },
  { match: ['crema de cacahuate', 'mantequilla de mani'], calories: 190, protein: 7, carbs: 6, fat: 16 },
  { match: ['aceite de oliva', 'aceite'], calories: 119, protein: 0, carbs: 0, fat: 14 },
  { match: ['ensalada', 'lechuga', 'verduras mixtas'], calories: 25, protein: 2, carbs: 5, fat: 0 },
  { match: ['brocoli', 'brócoli'], calories: 55, protein: 4, carbs: 11, fat: 0 },
  { match: ['zanahoria'], calories: 41, protein: 1, carbs: 10, fat: 0 },
  { match: ['papa', 'patata'], calories: 160, protein: 4, carbs: 37, fat: 0 },
  { match: ['camote', 'batata'], calories: 112, protein: 2, carbs: 26, fat: 0 },
  { match: ['pasta', 'espagueti'], calories: 220, protein: 8, carbs: 43, fat: 1 },
  { match: ['lenteja', 'lentejas'], calories: 230, protein: 18, carbs: 40, fat: 1 },
  { match: ['granola'], calories: 200, protein: 5, carbs: 30, fat: 7 },
  { match: ['barra de proteina', 'barra proteica'], calories: 200, protein: 20, carbs: 20, fat: 7 },
  { match: ['batido de proteina', 'proteina en polvo', 'whey'], calories: 120, protein: 24, carbs: 3, fat: 1 },
];

const DEFAULT_ESTIMATE = { calories: 150, protein: 5, carbs: 18, fat: 6 };

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

function lookupReference(name) {
  const normalized = normalize(name);
  for (const entry of REFERENCE_FOODS) {
    if (entry.match.some((m) => normalized.includes(normalize(m)))) {
      return { calories: entry.calories, protein: entry.protein, carbs: entry.carbs, fat: entry.fat, estimated: true };
    }
  }
  return { ...DEFAULT_ESTIMATE, estimated: true };
}

module.exports = { lookupReference, REFERENCE_FOODS };

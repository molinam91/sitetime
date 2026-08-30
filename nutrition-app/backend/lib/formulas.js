// Fórmulas nutricionales estándar y documentadas.
//
// BMR (metabolismo basal): ecuación de Mifflin-St Jeor (1990), la más
// precisa y recomendada actualmente por la Academy of Nutrition and
// Dietetics para población general (frente a Harris-Benedict).
//   Hombres: BMR = 10*peso(kg) + 6.25*estatura(cm) - 5*edad + 5
//   Mujeres: BMR = 10*peso(kg) + 6.25*estatura(cm) - 5*edad - 161
//
// TDEE (gasto energético total): BMR * factor de actividad (factores de
// actividad de Harris-Benedict / ACSM, ampliamente usados en la práctica
// clínica y deportiva).
//
// Meta calórica: déficit/superávit moderados y sostenibles, nunca por
// debajo de un mínimo seguro ni por encima de límites razonables de
// ganancia, siguiendo las guías generales de pérdida de peso segura
// (~0.5 kg/semana, déficit ~500 kcal/día, tope de 20% del TDEE) de
// organismos como la OMS/CDC.

const ACTIVITY_LEVELS = {
  sedentary: { label: 'Sedentario (poco o nada de ejercicio)', factor: 1.2 },
  light: { label: 'Actividad ligera (1-3 días/semana)', factor: 1.375 },
  moderate: { label: 'Actividad moderada (3-5 días/semana)', factor: 1.55 },
  active: { label: 'Activo (6-7 días/semana)', factor: 1.725 },
  very_active: { label: 'Muy activo (ejercicio intenso + trabajo físico)', factor: 1.9 },
};

const MIN_SAFE_CALORIES = { male: 1500, female: 1200 };

function calculateBMR({ weightKg, heightCm, age, sex }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

function calculateTDEE({ bmr, activityLevel }) {
  const factor = ACTIVITY_LEVELS[activityLevel]?.factor ?? ACTIVITY_LEVELS.sedentary.factor;
  return bmr * factor;
}

// goalType: 'lose' | 'maintain' | 'gain'
function calculateCalorieTarget({ tdee, goalType, sex }) {
  const minSafe = MIN_SAFE_CALORIES[sex] ?? MIN_SAFE_CALORIES.female;

  if (goalType === 'lose') {
    const moderateDeficitTarget = tdee - 500; // ~0.45-0.5 kg/semana
    const maxAllowedDeficitTarget = tdee * 0.8; // nunca más de 20% de déficit
    // El resultado nunca baja del mínimo seguro ni supera el 20% de déficit,
    // es decir tomamos el mayor de los dos límites (el menos agresivo).
    const target = Math.max(moderateDeficitTarget, maxAllowedDeficitTarget, minSafe);
    return Math.round(target);
  }

  if (goalType === 'gain') {
    const target = tdee + 400; // superávit moderado, ganancia magra sostenible
    return Math.round(target);
  }

  return Math.round(tdee);
}

// Macros sugeridos: proteína alta para preservar masa muscular
// (1.6-2.2 g/kg es el rango respaldado por estudios de composición
// corporal en déficit calórico), grasa ~25-30% de las calorías totales
// (mínimo necesario para función hormonal), y el resto en carbohidratos.
function calculateMacros({ targetCalories, weightKg, goalType }) {
  const proteinPerKg = goalType === 'lose' ? 2.0 : goalType === 'gain' ? 1.8 : 1.8;
  const proteinG = Math.round(proteinPerKg * weightKg);
  const proteinCalories = proteinG * 4;

  const fatCalories = targetCalories * 0.28;
  const fatG = Math.round(fatCalories / 9);

  const remainingCalories = Math.max(0, targetCalories - proteinCalories - fatG * 9);
  const carbsG = Math.round(remainingCalories / 4);

  return { proteinG, fatG, carbsG };
}

function calculateFullProfile({ weightKg, heightCm, age, sex, activityLevel, goalType, goalWeightKg }) {
  const bmr = calculateBMR({ weightKg, heightCm, age, sex });
  const tdee = calculateTDEE({ bmr, activityLevel });
  const targetCalories = calculateCalorieTarget({ tdee, goalType, sex });
  const macros = calculateMacros({ targetCalories, weightKg, goalType });

  const largeChange = goalWeightKg != null && Math.abs(goalWeightKg - weightKg) / weightKg >= 0.15;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories,
    macros,
    largeChange,
  };
}

module.exports = {
  ACTIVITY_LEVELS,
  MIN_SAFE_CALORIES,
  calculateBMR,
  calculateTDEE,
  calculateCalorieTarget,
  calculateMacros,
  calculateFullProfile,
};

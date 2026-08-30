# NutriTrack

Aplicación de seguimiento nutricional personal: perfil con cálculo calórico
(Mifflin-St Jeor), registro de alimentos propios, generación automática de
menús diarios/semanales, historial de peso con gráfica y favoritos.

## Estructura

- `backend/` — API REST en Express, persistencia en SQLite (`node:sqlite`,
  nativo de Node 22+, sin dependencias de compilación).
- `frontend/` — React + Vite, mobile-first.

## Cómo correrlo

En dos terminales:

```bash
cd nutrition-app/backend
npm install
npm start        # http://localhost:4000
```

```bash
cd nutrition-app/frontend
npm install
npm run dev       # http://localhost:5173 (proxy /api -> backend)
```

La base de datos SQLite se crea automáticamente en `backend/data/nutrition.db`
la primera vez que arranca el servidor.

## Cálculos nutricionales

- **BMR (metabolismo basal)**: fórmula de Mifflin-St Jeor.
- **TDEE (gasto total)**: BMR × factor de actividad.
- **Meta calórica**: déficit/superávit moderado y sostenible (nunca por
  debajo del mínimo seguro: 1200 kcal mujeres / 1500 kcal hombres, ni más
  de 20% de déficit).
- **Macros**: proteína alta para preservar masa muscular, grasa 28% de las
  calorías, resto en carbohidratos.

Ver `backend/lib/formulas.js` para el detalle y las referencias.

⚠️ La app no sustituye el consejo de un nutriólogo o médico, especialmente
si la meta de peso implica un cambio grande.

## Funcionalidad

1. **Perfil**: peso, estatura, edad, sexo, actividad y meta → BMR, TDEE,
   meta calórica y macros sugeridos.
2. **Mis alimentos**: alta/edición/borrado de alimentos propios por
   categoría (desayuno/comida/cena/snack). Si no se conocen las calorías,
   se autocompletan con una tabla de valores estándar editable.
3. **Menú del día**: se genera automáticamente combinando los alimentos
   guardados sin superar la meta calórica, priorizando los marcados como
   favoritos (❤️) y excluyendo los marcados como no deseados (🚫).
4. **Progreso**: historial de peso editable con gráfica de evolución.
5. **Favoritos**: alimentos y menús completos guardados como favoritos para
   priorizarlos en futuras sugerencias.

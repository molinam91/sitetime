import { useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';

const CATEGORIES = [
  { value: 'desayuno', label: 'Desayuno' },
  { value: 'comida', label: 'Comida' },
  { value: 'cena', label: 'Cena' },
  { value: 'snack', label: 'Snack' },
];

const emptyForm = { name: '', category: 'desayuno', calories: '', protein: '', carbs: '', fat: '' };

export default function Foods() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('todos');
  const [suggestion, setSuggestion] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.getFoods().then(setFoods).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleNameBlur() {
    if (!form.name.trim() || form.calories !== '') return;
    try {
      const est = await api.estimateFood(form.name);
      setSuggestion(est);
    } catch {
      setSuggestion(null);
    }
  }

  function applySuggestion() {
    if (!suggestion) return;
    setForm((f) => ({
      ...f,
      calories: suggestion.calories,
      protein: suggestion.protein,
      carbs: suggestion.carbs,
      fat: suggestion.fat,
    }));
    setSuggestion(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const payload = {
      name: form.name.trim(),
      category: form.category,
      calories: form.calories === '' ? null : Number(form.calories),
      protein: form.protein === '' ? null : Number(form.protein),
      carbs: form.carbs === '' ? null : Number(form.carbs),
      fat: form.fat === '' ? null : Number(form.fat),
    };

    try {
      if (editingId) {
        await api.updateFood(editingId, payload);
      } else {
        await api.addFood(payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      setSuggestion(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  function startEdit(food) {
    setEditingId(food.id);
    setForm({
      name: food.name,
      category: food.category,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setSuggestion(null);
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este alimento?')) return;
    await api.deleteFood(id);
    load();
  }

  async function toggleLike(food) {
    if (food.liked) await api.unlikeFood(food.id);
    else await api.likeFood(food.id);
    load();
  }

  async function toggleDislike(food) {
    if (food.disliked) await api.unlikeFood(food.id);
    else await api.dislikeFood(food.id);
    load();
  }

  const visibleFoods = filter === 'todos' ? foods : foods.filter((f) => f.category === filter);

  return (
    <div>
      <div className="app-header">
        <h1>Mis alimentos</h1>
        <p>Agrega los alimentos que te gustan para generar tus menús.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <form className="card" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Editar alimento' : 'Agregar alimento'}</h2>

        <div className="field">
          <label>Nombre</label>
          <input
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            onBlur={handleNameBlur}
            placeholder="Ej. Pechuga de pollo"
          />
        </div>

        {suggestion && (
          <div className="disclaimer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Sugerencia: ~{suggestion.calories} kcal (P {suggestion.protein}g · C {suggestion.carbs}g · G {suggestion.fat}g)</span>
            <button type="button" className="btn btn-secondary" onClick={applySuggestion}>Usar</button>
          </div>
        )}

        <div className="field">
          <label>Categoría</label>
          <select value={form.category} onChange={(e) => update('category', e.target.value)}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div className="row">
          <div className="field">
            <label>Calorías (opcional)</label>
            <input type="number" min="0" value={form.calories} onChange={(e) => update('calories', e.target.value)} placeholder="Se estima si se deja vacío" />
          </div>
        </div>

        <div className="row">
          <div className="field">
            <label>Proteína (g)</label>
            <input type="number" min="0" value={form.protein} onChange={(e) => update('protein', e.target.value)} />
          </div>
          <div className="field">
            <label>Carbos (g)</label>
            <input type="number" min="0" value={form.carbs} onChange={(e) => update('carbs', e.target.value)} />
          </div>
          <div className="field">
            <label>Grasas (g)</label>
            <input type="number" min="0" value={form.fat} onChange={(e) => update('fat', e.target.value)} />
          </div>
        </div>

        <div className="row">
          <button className="btn btn-primary" type="submit">{editingId ? 'Guardar cambios' : 'Agregar'}</button>
          {editingId && <button type="button" className="btn btn-secondary" onClick={cancelEdit}>Cancelar</button>}
        </div>
      </form>

      <div className="pill-tabs">
        <div className={`pill-tab ${filter === 'todos' ? 'active' : ''}`} onClick={() => setFilter('todos')}>Todos</div>
        {CATEGORIES.map((c) => (
          <div key={c.value} className={`pill-tab ${filter === c.value ? 'active' : ''}`} onClick={() => setFilter(c.value)}>
            {c.label}
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Lista ({visibleFoods.length})</h2>
        {loading ? (
          <div className="loading">Cargando…</div>
        ) : visibleFoods.length === 0 ? (
          <div className="empty-state">No hay alimentos en esta categoría todavía.</div>
        ) : (
          visibleFoods.map((food) => (
            <div className="food-item" key={food.id}>
              <div className="food-info">
                <div className="food-name">
                  {food.name}
                  {food.isEstimated && <span className="badge badge-estimated">estimado</span>}
                </div>
                <div className="food-meta">
                  {Math.round(food.calories)} kcal · P {food.protein}g · C {food.carbs}g · G {food.fat}g
                </div>
              </div>
              <div className="food-actions">
                <button className={`btn btn-icon ${food.liked ? 'btn-liked' : ''}`} onClick={() => toggleLike(food)} title="Me gusta">
                  {food.liked ? '❤️' : '🤍'}
                </button>
                <button className={`btn btn-icon ${food.disliked ? 'btn-liked' : ''}`} onClick={() => toggleDislike(food)} title="No me gusta">
                  {food.disliked ? '🚫' : '⛔'}
                </button>
                <button className="btn btn-icon" onClick={() => startEdit(food)} title="Editar">✏️</button>
                <button className="btn btn-icon btn-danger" onClick={() => handleDelete(food.id)} title="Eliminar">🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

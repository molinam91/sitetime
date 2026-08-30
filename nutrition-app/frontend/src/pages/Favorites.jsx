import { useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';

const CATEGORY_LABELS = { desayuno: 'Desayuno', comida: 'Comida', cena: 'Cena', snack: 'Snack' };

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [likedFoods, setLikedFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.getFavoriteMenus(), api.getFoods()])
      .then(([menus, foods]) => {
        setFavorites(menus);
        setLikedFoods(foods.filter((f) => f.liked));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function handleDeleteMenu(id) {
    await api.deleteFavoriteMenu(id);
    load();
  }

  async function handleUnlikeFood(id) {
    await api.unlikeFood(id);
    load();
  }

  return (
    <div>
      <div className="app-header">
        <h1>Favoritos</h1>
        <p>Tus alimentos y menús marcados con ❤️ se priorizan en las sugerencias.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h2>Alimentos favoritos ({likedFoods.length})</h2>
        {loading ? (
          <div className="loading">Cargando…</div>
        ) : likedFoods.length === 0 ? (
          <div className="empty-state">Marca alimentos con ❤️ desde "Mis alimentos" o el menú del día.</div>
        ) : (
          likedFoods.map((food) => (
            <div className="food-item" key={food.id}>
              <div className="food-info">
                <div className="food-name">{food.name}</div>
                <div className="food-meta">{Math.round(food.calories)} kcal · {CATEGORY_LABELS[food.category]}</div>
              </div>
              <div className="food-actions">
                <button className="btn btn-icon btn-liked" onClick={() => handleUnlikeFood(food.id)} title="Quitar de favoritos">❤️</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <h2>Menús guardados ({favorites.length})</h2>
        {loading ? (
          <div className="loading">Cargando…</div>
        ) : favorites.length === 0 ? (
          <div className="empty-state">Guarda tu menú del día desde la pantalla principal para verlo aquí.</div>
        ) : (
          favorites.map((menu) => (
            <div key={menu.id} style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <div className="meal-title">
                <span>{menu.date}</span>
                <span>{Math.round(menu.totalCalories)} kcal</span>
              </div>
              {Object.entries(menu.items).map(([cat, foods]) =>
                foods.length > 0 && (
                  <div key={cat} style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>
                    <strong>{CATEGORY_LABELS[cat] || cat}:</strong> {foods.map((f) => f.name).join(', ')}
                  </div>
                )
              )}
              <button className="btn btn-icon btn-danger" onClick={() => handleDeleteMenu(menu.id)} title="Eliminar" style={{ marginTop: 6 }}>
                🗑️ Quitar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

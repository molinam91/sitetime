import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import CalorieRing from '../components/CalorieRing.jsx';
import MacroBars from '../components/MacroBars.jsx';
import MenuCard from '../components/MenuCard.jsx';

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [menu, setMenu] = useState(null);
  const [log, setLog] = useState({ items: [], totalCalories: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedMsg, setSavedMsg] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([api.getProfile(), api.getDailyLog()])
      .then(async ([prof, logData]) => {
        setProfile(prof);
        setLog(logData);
        if (prof) {
          const m = await api.getDailyMenu();
          setMenu(m);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function handleEat(foodId) {
    await api.addLogEntry(foodId);
    const logData = await api.getDailyLog();
    setLog(logData);
  }

  async function handleLikeFood(foodId) {
    await api.likeFood(foodId);
    const m = await api.getDailyMenu();
    setMenu(m);
  }

  async function handleDislikeFood(foodId) {
    await api.dislikeFood(foodId);
    const m = await api.getDailyMenu();
    setMenu(m);
  }

  async function handleRegenerate() {
    setLoading(true);
    const m = await api.getDailyMenu();
    setMenu(m);
    setLoading(false);
  }

  async function handleSaveFavorite() {
    if (!menu) return;
    await api.saveFavoriteMenu({ items: menu.items, totalCalories: menu.totalCalories, liked: true });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  }

  const eatenFoodIds = log.items.map((i) => i.id);
  const consumedMacros = log.items.reduce(
    (acc, i) => ({ protein: acc.protein + i.protein, carbs: acc.carbs + i.carbs, fat: acc.fat + i.fat }),
    { protein: 0, carbs: 0, fat: 0 }
  );

  if (loading && !profile) return <div className="loading">Cargando…</div>;

  if (!profile) {
    return (
      <div>
        <div className="app-header">
          <h1>Hola 👋</h1>
        </div>
        <div className="card empty-state">
          Primero completa tu <Link to="/perfil">perfil</Link> para calcular tu meta calórica diaria.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="app-header">
        <h1>Hoy</h1>
        <p>Tu resumen diario de calorías y menú sugerido.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <CalorieRing consumed={Math.round(log.totalCalories)} target={profile.targetCalories} />
        <MacroBars macros={profile.macros} consumedMacros={consumedMacros} />
      </div>

      <div className="card">
        <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Menú sugerido de hoy</span>
          <button className="btn btn-icon" onClick={handleRegenerate} title="Generar otro menú">🔄</button>
        </h2>

        {!menu || menu.empty ? (
          <div className="empty-state">
            Agrega alimentos en <Link to="/alimentos">Mis alimentos</Link> para que se genere tu menú del día.
          </div>
        ) : (
          <>
            <MenuCard menu={menu} onEat={handleEat} onLikeFood={handleLikeFood} onDislikeFood={handleDislikeFood} eatenFoodIds={eatenFoodIds} />
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: 8 }} onClick={handleSaveFavorite}>
              {savedMsg ? '✅ Guardado en favoritos' : '❤️ Guardar este menú como favorito'}
            </button>
          </>
        )}
      </div>

      {log.items.length > 0 && (
        <div className="card">
          <h2>Ya comiste hoy</h2>
          {log.items.map((item) => (
            <div className="food-item" key={item.logId}>
              <div className="food-info">
                <div className="food-name">{item.name}</div>
                <div className="food-meta">{Math.round(item.calories)} kcal</div>
              </div>
              <button className="btn btn-icon btn-danger" onClick={async () => { await api.deleteLogEntry(item.logId); load(); }} title="Quitar">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

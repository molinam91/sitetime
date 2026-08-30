import { useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';
import WeightChart from '../components/WeightChart.jsx';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function Progress() {
  const [history, setHistory] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newWeight, setNewWeight] = useState('');
  const [newDate, setNewDate] = useState(today());

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.getWeightHistory(), api.getProfile()])
      .then(([hist, prof]) => {
        setHistory(hist);
        setProfile(prof);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newWeight) return;
    setError(null);
    try {
      await api.addWeightEntry({ weightKg: Number(newWeight), date: newDate });
      setNewWeight('');
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este registro de peso?')) return;
    await api.deleteWeightEntry(id);
    load();
  }

  const first = history[0];
  const last = history[history.length - 1];
  const change = first && last ? (last.weightKg - first.weightKg).toFixed(1) : null;

  return (
    <div>
      <div className="app-header">
        <h1>Progreso de peso</h1>
        <p>Registra tu peso cuando quieras para ver tu evolución.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <form className="card" onSubmit={handleAdd}>
        <h2>Nuevo registro</h2>
        <div className="weight-entry-form">
          <input type="number" step="0.1" min="1" placeholder="Peso (kg)" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} required />
          <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required />
          <button className="btn btn-primary" type="submit" style={{ width: 'auto', padding: '11px 16px' }}>Guardar</button>
        </div>
      </form>

      <div className="card">
        <h2>Evolución</h2>
        {loading ? <div className="loading">Cargando…</div> : (
          <WeightChart history={history} goalWeightKg={profile?.goalWeightKg} />
        )}
        {change !== null && (
          <div className="stat-row" style={{ marginTop: 10 }}>
            <div className="stat-box">
              <div className="value">{first.weightKg} kg</div>
              <div className="label">Inicio ({first.date})</div>
            </div>
            <div className="stat-box">
              <div className="value">{last.weightKg} kg</div>
              <div className="label">Actual ({last.date})</div>
            </div>
            <div className="stat-box">
              <div className="value" style={{ color: change < 0 ? '#10b981' : change > 0 ? '#ef4444' : undefined }}>
                {change > 0 ? '+' : ''}{change} kg
              </div>
              <div className="label">Cambio total</div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Historial ({history.length})</h2>
        {history.length === 0 ? (
          <div className="empty-state">Aún no hay registros.</div>
        ) : (
          [...history].reverse().map((h) => (
            <div className="food-item" key={h.id}>
              <div className="food-info">
                <div className="food-name">{h.weightKg} kg</div>
                <div className="food-meta">{h.date}{h.note ? ` · ${h.note}` : ''}</div>
              </div>
              <div className="food-actions">
                <button className="btn btn-icon btn-danger" onClick={() => handleDelete(h.id)} title="Eliminar">🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

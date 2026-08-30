import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Disclaimer from '../components/Disclaimer.jsx';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentario (poco o nada de ejercicio)' },
  { value: 'light', label: 'Actividad ligera (1-3 días/semana)' },
  { value: 'moderate', label: 'Actividad moderada (3-5 días/semana)' },
  { value: 'active', label: 'Activo (6-7 días/semana)' },
  { value: 'very_active', label: 'Muy activo (ejercicio intenso + trabajo físico)' },
];

const emptyForm = {
  weightKg: '',
  heightCm: '',
  age: '',
  sex: 'female',
  activityLevel: 'sedentary',
  goalType: 'maintain',
  goalWeightKg: '',
};

export default function Profile() {
  const [form, setForm] = useState(emptyForm);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getProfile()
      .then((data) => {
        if (data) {
          setProfile(data);
          setForm({
            weightKg: data.weightKg,
            heightCm: data.heightCm,
            age: data.age,
            sex: data.sex,
            activityLevel: data.activityLevel,
            goalType: data.goalType,
            goalWeightKg: data.goalWeightKg ?? '',
          });
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        weightKg: Number(form.weightKg),
        heightCm: Number(form.heightCm),
        age: Number(form.age),
        sex: form.sex,
        activityLevel: form.activityLevel,
        goalType: form.goalType,
        goalWeightKg: form.goalWeightKg === '' ? null : Number(form.goalWeightKg),
      };
      const data = await api.saveProfile(payload);
      setProfile(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading">Cargando…</div>;

  return (
    <div>
      <div className="app-header">
        <h1>Tu perfil</h1>
        <p>Estos datos calculan tu meta calórica y macros diarios.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <form className="card" onSubmit={handleSubmit}>
        <h2>Datos personales</h2>

        <div className="row">
          <div className="field">
            <label>Peso actual (kg)</label>
            <input type="number" step="0.1" min="1" required value={form.weightKg} onChange={(e) => update('weightKg', e.target.value)} />
          </div>
          <div className="field">
            <label>Estatura (cm)</label>
            <input type="number" step="0.1" min="1" required value={form.heightCm} onChange={(e) => update('heightCm', e.target.value)} />
          </div>
        </div>

        <div className="row">
          <div className="field">
            <label>Edad</label>
            <input type="number" min="1" required value={form.age} onChange={(e) => update('age', e.target.value)} />
          </div>
          <div className="field">
            <label>Sexo</label>
            <select value={form.sex} onChange={(e) => update('sex', e.target.value)}>
              <option value="female">Mujer</option>
              <option value="male">Hombre</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label>Nivel de actividad física</label>
          <select value={form.activityLevel} onChange={(e) => update('activityLevel', e.target.value)}>
            {ACTIVITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Meta</label>
          <select value={form.goalType} onChange={(e) => update('goalType', e.target.value)}>
            <option value="lose">Bajar de peso</option>
            <option value="maintain">Mantener peso</option>
            <option value="gain">Subir de peso</option>
          </select>
        </div>

        <div className="field">
          <label>Peso deseado / meta (kg) — opcional</label>
          <input type="number" step="0.1" min="1" value={form.goalWeightKg} onChange={(e) => update('goalWeightKg', e.target.value)} />
        </div>

        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar y calcular'}
        </button>
      </form>

      {profile && (
        <>
          <Disclaimer largeChange={profile.largeChange} />

          <div className="card">
            <h2>Resultados</h2>
            <div className="stat-row">
              <div className="stat-box">
                <div className="value">{profile.bmr}</div>
                <div className="label">BMR (kcal/día)</div>
              </div>
              <div className="stat-box">
                <div className="value">{profile.tdee}</div>
                <div className="label">Gasto total (TDEE)</div>
              </div>
              <div className="stat-box">
                <div className="value">{profile.targetCalories}</div>
                <div className="label">Meta diaria</div>
              </div>
            </div>

            <h2 style={{ marginTop: 4 }}>Macros sugeridos</h2>
            <div className="stat-row">
              <div className="stat-box">
                <div className="value">{profile.macros.proteinG}g</div>
                <div className="label">Proteína</div>
              </div>
              <div className="stat-box">
                <div className="value">{profile.macros.carbsG}g</div>
                <div className="label">Carbohidratos</div>
              </div>
              <div className="stat-box">
                <div className="value">{profile.macros.fatG}g</div>
                <div className="label">Grasas</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

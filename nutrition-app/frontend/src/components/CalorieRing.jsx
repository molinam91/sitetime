export default function CalorieRing({ consumed, target }) {
  const pct = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0;
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const remaining = Math.max(0, target - consumed);
  const over = consumed > target;

  return (
    <div className="progress-ring-wrap">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="12" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={over ? '#ef4444' : '#10b981'}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
        />
        <text x="70" y="65" textAnchor="middle" fontSize="22" fontWeight="700" fill="#1e293b">
          {consumed}
        </text>
        <text x="70" y="85" textAnchor="middle" fontSize="11" fill="#64748b">
          de {target} kcal
        </text>
      </svg>
      <div className="progress-ring-label">
        {over ? `${consumed - target} kcal por encima de tu meta` : `${remaining} kcal disponibles hoy`}
      </div>
    </div>
  );
}

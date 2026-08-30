import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function WeightChart({ history, goalWeightKg }) {
  if (!history || history.length === 0) {
    return <div className="empty-state">Aún no hay registros de peso.</div>;
  }

  const data = history.map((h) => ({
    date: h.date.slice(5),
    peso: h.weightKg,
  }));

  const weights = data.map((d) => d.peso);
  const min = Math.min(...weights, goalWeightKg ?? Infinity);
  const max = Math.max(...weights, goalWeightKg ?? -Infinity);
  const padding = Math.max(1, (max - min) * 0.15);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" fontSize={11} stroke="#64748b" />
        <YAxis domain={[min - padding, max + padding]} fontSize={11} stroke="#64748b" />
        <Tooltip formatter={(value) => [`${value} kg`, 'Peso']} />
        <Line type="monotone" dataKey="peso" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

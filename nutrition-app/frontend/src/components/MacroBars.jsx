export default function MacroBars({ macros, consumedMacros }) {
  const items = [
    { key: 'proteinG', label: 'Proteína', cls: 'macro-protein', consumed: consumedMacros?.protein },
    { key: 'carbsG', label: 'Carbos', cls: 'macro-carbs', consumed: consumedMacros?.carbs },
    { key: 'fatG', label: 'Grasas', cls: 'macro-fat', consumed: consumedMacros?.fat },
  ];

  return (
    <div className="macro-bars">
      {items.map((item) => {
        const target = macros[item.key] || 0;
        const consumed = Math.round(item.consumed || 0);
        const pct = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0;
        return (
          <div className="macro-bar" key={item.key}>
            <div className="macro-bar-track">
              <div className={`macro-bar-fill ${item.cls}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="macro-bar-value">{consumed}g</div>
            <div className="macro-bar-label">{item.label} / {target}g</div>
          </div>
        );
      })}
    </div>
  );
}

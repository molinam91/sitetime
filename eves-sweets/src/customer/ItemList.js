import { useState } from "react";
import { fmtMoney, BUNDLE_TIER_PRICE, BUNDLE_PAIR_PRICE, FREE_DELIVERY_TIER_PRICE, FREE_DELIVERY_TIER_THRESHOLD } from "../lib/business";
import ImageModal from "./ImageModal";

export default function ItemList({ category, menu, currency, cart, setCart }) {
  const [photo, setPhoto] = useState(null);
  const items = menu.filter((it) => (it.category || "menu") === category && it.active !== false).sort((a, b) => (b.price || 0) - (a.price || 0));

  if (items.length === 0) {
    return <div className="empty">{category === "catering" ? "No catering packages yet." : "No menu items yet."} Check back soon!</div>;
  }

  function inc(id) {
    setCart((prev) => ({ ...prev, [id]: { qty: (prev[id]?.qty || 0) + 1, extras: prev[id]?.extras || {} } }));
  }
  function dec(id) {
    setCart((prev) => {
      const entry = prev[id];
      if (!entry) return prev;
      const qty = entry.qty - 1;
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = { ...entry, qty };
      return next;
    });
  }
  function toggleExtra(id, exId, checked) {
    setCart((prev) => ({ ...prev, [id]: { ...prev[id], extras: { ...prev[id].extras, [exId]: checked } } }));
  }

  return (
    <div>
      {items.map((it) => {
        const entry = cart[it.id];
        const qty = entry ? entry.qty : 0;
        return (
          <div className="card" key={it.id}>
            <div className="item-row">
              {it.image ? (
                <img className="item-img" src={it.image} alt={it.name} onClick={() => setPhoto(it)} />
              ) : (
                <div className="item-emoji-ph">🍞</div>
              )}
              <div className="item-info">
                <h3>{it.name}</h3>
                <div className="desc">
                  {it.description || ""}
                  {it.serves ? ` · Serves ${it.serves}` : ""}
                </div>
                <div className="price">{fmtMoney(currency, it.price)}</div>
                {it.price === BUNDLE_TIER_PRICE && (
                  <div className="small" style={{ color: "var(--good)", fontWeight: 600 }}>
                    🎉 Compra 2 y paga ${BUNDLE_PAIR_PRICE}
                  </div>
                )}
                {it.price === FREE_DELIVERY_TIER_PRICE && (
                  <div className="small" style={{ color: "var(--good)", fontWeight: 600 }}>
                    🎉 {FREE_DELIVERY_TIER_THRESHOLD / FREE_DELIVERY_TIER_PRICE} de ${FREE_DELIVERY_TIER_PRICE} = envío gratis
                  </div>
                )}
                <div className="qty-row">
                  <button className="qty-btn" onClick={() => dec(it.id)}>
                    −
                  </button>
                  <span className="qty-val">{qty}</span>
                  <button className="qty-btn" onClick={() => inc(it.id)}>
                    +
                  </button>
                </div>
                {it.extras && it.extras.length > 0 && qty > 0 && (
                  <div className="extras-box" style={{ marginTop: 8 }}>
                    {it.extras.map((ex) => (
                      <label key={ex.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginTop: 4 }}>
                        <input
                          type="checkbox"
                          checked={!!entry?.extras?.[ex.id]}
                          onChange={(e) => toggleExtra(it.id, ex.id, e.target.checked)}
                        />
                        {ex.name} (+{fmtMoney(currency, ex.price)})
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <ImageModal src={photo?.image} alt={photo?.name} onClose={() => setPhoto(null)} />
    </div>
  );
}

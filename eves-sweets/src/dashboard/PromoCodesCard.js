import { useState } from "react";
import { fmtMoney, findPromoByCode, menuItemById } from "../lib/business";
import { saveSettings } from "../lib/data";
import { toast, uid } from "../lib/toast";

function describePromo(p, menu) {
  if (p.type === "free_delivery") return "Envío gratis";
  const item = menuItemById(menu, p.itemId);
  return `${item ? item.name : "(artículo eliminado)"} gratis con compra de ${fmtMoney("$", p.minPurchase || 0)}+`;
}

function ItemSelect({ menu, value, onChange }) {
  return (
    <select value={value || ""} onChange={(e) => onChange(e.target.value)}>
      {menu.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>
  );
}

function EditPromoBox({ promo, menu, codes, settings, onDone }) {
  const [code, setCode] = useState(promo.code);
  const [type, setType] = useState(promo.type);
  const [minPurchase, setMinPurchase] = useState(promo.minPurchase || "");
  const [itemId, setItemId] = useState(promo.itemId || menu[0]?.id);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!code.trim()) {
      toast("Ingresa un código");
      return;
    }
    const updated = { ...promo, code: code.trim(), type };
    if (type === "free_item") {
      updated.minPurchase = parseFloat(minPurchase) || 0;
      updated.itemId = itemId;
    } else {
      delete updated.minPurchase;
      delete updated.itemId;
    }
    const newCodes = codes.map((x) => (x.id === promo.id ? updated : x));
    setSaving(true);
    try {
      await saveSettings({ ...settings, promoCodes: newCodes });
      onDone();
    } catch (e) {
      toast("Could not save — check your connection and try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <hr className="divider" />
      <label>Código</label>
      <input value={code} onChange={(e) => setCode(e.target.value)} />
      <label>Tipo</label>
      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="free_delivery">Envío gratis (sin mínimo)</option>
        <option value="free_item">Artículo gratis con compra mínima</option>
      </select>
      {type === "free_item" && (
        <div>
          <label>Compra mínima ($)</label>
          <input type="number" step="0.01" value={minPurchase} onChange={(e) => setMinPurchase(e.target.value)} />
          <label>Artículo gratis</label>
          <ItemSelect menu={menu} value={itemId} onChange={setItemId} />
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button className="btn block" disabled={saving} onClick={save}>
          Guardar
        </button>
        <button className="btn secondary" onClick={onDone}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default function PromoCodesCard({ settings, menu }) {
  const codes = settings.promoCodes || [];
  const [editingId, setEditingId] = useState(null);
  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState("free_delivery");
  const [newMin, setNewMin] = useState("");
  const [newItemId, setNewItemId] = useState(menu[0]?.id);
  const [adding, setAdding] = useState(false);

  async function deletePromo(id) {
    try {
      await saveSettings({ ...settings, promoCodes: codes.filter((x) => x.id !== id) });
    } catch (e) {
      toast("Could not save — check your connection and try again");
    }
  }

  async function addPromo() {
    if (!newCode.trim()) {
      toast("Ingresa un código");
      return;
    }
    if (findPromoByCode(codes, newCode)) {
      toast("Ese código ya existe");
      return;
    }
    const promo = { id: uid(), code: newCode.trim(), type: newType };
    if (newType === "free_item") {
      promo.minPurchase = parseFloat(newMin) || 0;
      promo.itemId = newItemId;
      if (!promo.itemId) {
        toast("Selecciona un artículo gratis");
        return;
      }
    }
    setAdding(true);
    try {
      await saveSettings({ ...settings, promoCodes: [...codes, promo] });
      setNewCode("");
      setNewMin("");
    } catch (e) {
      toast("Could not save — check your connection and try again");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="card">
      <h3>🎟️ Promo Codes</h3>
      <p className="small">Crea códigos que tus clientes pueden usar al pagar: envío gratis, o un artículo gratis con compra mínima.</p>
      {codes.length === 0 && <div className="small">Aún no hay códigos.</div>}
      {codes.map((p) => (
        <div className="card" style={{ background: "var(--input-bg)", marginBottom: 8 }} key={p.id}>
          <div className="row-between">
            <div>
              <div style={{ fontWeight: 700 }}>{p.code}</div>
              <div className="small">{describePromo(p, menu)}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn ghost" onClick={() => setEditingId(editingId === p.id ? null : p.id)}>
                Edit
              </button>
              <button className="btn ghost" onClick={() => deletePromo(p.id)}>
                Delete
              </button>
            </div>
          </div>
          {editingId === p.id && <EditPromoBox promo={p} menu={menu} codes={codes} settings={settings} onDone={() => setEditingId(null)} />}
        </div>
      ))}
      <hr className="divider" />
      <div className="small" style={{ fontWeight: 600, marginBottom: 4 }}>
        Agregar código
      </div>
      <label>Código</label>
      <input placeholder="ej. COWORKER10" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
      <label>Tipo</label>
      <select value={newType} onChange={(e) => setNewType(e.target.value)}>
        <option value="free_delivery">Envío gratis (sin mínimo)</option>
        <option value="free_item">Artículo gratis con compra mínima</option>
      </select>
      {newType === "free_item" && (
        <div>
          <label>Compra mínima ($)</label>
          <input type="number" step="0.01" placeholder="50.00" value={newMin} onChange={(e) => setNewMin(e.target.value)} />
          <label>Artículo gratis</label>
          <ItemSelect menu={menu} value={newItemId} onChange={setNewItemId} />
        </div>
      )}
      <button className="btn block" style={{ marginTop: 12 }} disabled={adding} onClick={addPromo}>
        Agregar código
      </button>
    </div>
  );
}

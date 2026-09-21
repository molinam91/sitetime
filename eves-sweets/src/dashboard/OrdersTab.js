import { useState } from "react";
import { fmtMoney, fmtDateLong, fmtPlaced, isoToDate, upcomingFridayOptions } from "../lib/business";
import { useOrders, addManualOrder, deleteOrder } from "../lib/data";
import { toast } from "../lib/toast";
import ReceiptModal from "./ReceiptModal";

function ManualAddForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const fridayOptions = upcomingFridayOptions(10);
  const [dueDate, setDueDate] = useState(fridayOptions[0]?.iso || "");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function add() {
    const total = parseFloat(amount);
    if (!name.trim() || isNaN(total)) {
      toast("Ingresa nombre y total");
      return;
    }
    setSaving(true);
    try {
      await addManualOrder({ customerName: name.trim(), phone: "", fulfillment: null, address: "", dueDate, notes: notes.trim(), total, items: null });
      setName("");
      setAmount("");
      setNotes("");
    } catch (e) {
      toast("No se pudo guardar — revisa tu conexión");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div style={{ textAlign: "center", margin: "6px 0 14px" }}>
        <button className="btn ghost" onClick={() => setOpen((o) => !o)}>
          o agregar manualmente
        </button>
      </div>
      {open && (
        <div className="card">
          <h3>Agregar pedido manual</h3>
          <label>Nombre del cliente</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
          <label>Total del pedido</label>
          <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          <label>Fecha de entrega</label>
          <select value={dueDate} onChange={(e) => setDueDate(e.target.value)}>
            {fridayOptions.map((opt) => (
              <option key={opt.iso} value={opt.iso}>
                {opt.label}
              </option>
            ))}
          </select>
          <label>Notas (opcional)</label>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button className="btn block" style={{ marginTop: 12 }} disabled={saving} onClick={add}>
            Agregar
          </button>
        </div>
      )}
    </>
  );
}

export default function OrdersTab({ currency }) {
  const { orders, loading } = useOrders();
  const [receiptOrder, setReceiptOrder] = useState(null);

  if (loading) return <div className="empty">Loading…</div>;

  const groups = {};
  orders.forEach((o) => {
    (groups[o.dueDate] = groups[o.dueDate] || []).push(o);
  });
  const sortedDates = Object.keys(groups).sort();

  return (
    <div>
      <div className="card">
        <h3>📩 Pedidos en vivo</h3>
        <p className="small">Los pedidos que los clientes hacen desde la página aparecen aquí automáticamente, en tiempo real, en todos los dispositivos.</p>
      </div>
      <ManualAddForm />
      {sortedDates.length === 0 && <div className="empty">Aún no hay pedidos registrados.</div>}
      {sortedDates.map((iso) => {
        const items = [...groups[iso]].sort((a, b) => a.orderNumber - b.orderNumber);
        const subtotal = items.reduce((s, o) => s + (o.total || 0), 0);
        return (
          <div className="card" key={iso}>
            <div className="row-between">
              <h3 style={{ margin: 0 }}>📅 {fmtDateLong(isoToDate(iso))}</h3>
              <div className="price">{fmtMoney(currency, subtotal)}</div>
            </div>
            <div className="small">Total de la semana</div>
            {items.map((o) => (
              <div
                key={o.id}
                className="row-between"
                style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--line)", cursor: "pointer" }}
                onClick={() => setReceiptOrder(o)}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>
                    #{o.orderNumber} — {o.customerName}
                  </div>
                  <div className="small">Pedido: {fmtPlaced(o.placedAt)}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontWeight: 700 }}>{fmtMoney(currency, o.total)}</div>
                  <button
                    className="btn ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteOrder(o.id);
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      })}
      <ReceiptModal order={receiptOrder} currency={currency} onClose={() => setReceiptOrder(null)} />
    </div>
  );
}

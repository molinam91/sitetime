import { fmtMoney, fmtDateLong, fmtPlaced, isoToDate } from "../lib/business";

export default function ReceiptModal({ order, currency, onClose }) {
  if (!order) return null;
  const fulfillHtml = order.fulfillment === "delivery" ? `🚚 Delivery to: ${order.address || "(no address)"}` : order.fulfillment === "pickup" ? "🏬 Pickup" : null;
  return (
    <div className="img-modal-overlay receipt-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card receipt-card">
        <div className="row-between">
          <h2 style={{ margin: 0 }}>Order #{order.orderNumber}</h2>
          <button className="btn ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        <hr className="divider" />
        <div>
          <strong>{order.customerName}</strong>
        </div>
        <div className="small">{order.phone || ""}</div>
        <div className="small" style={{ marginTop: 6 }}>
          Placed: {fmtPlaced(order.placedAt)}
        </div>
        <div style={{ fontWeight: 700, marginTop: 4 }}>📅 Ready: {fmtDateLong(isoToDate(order.dueDate))}</div>
        {fulfillHtml && <div style={{ marginTop: 8 }}>{fulfillHtml}</div>}
        <hr className="divider" />
        {order.items && order.items.length > 0 ? (
          order.items.map((i, idx) => (
            <div style={{ marginBottom: 8 }} key={idx}>
              <div className="row-between">
                <div>
                  {i.qty}× {i.name}
                </div>
                <div>{fmtMoney(currency, i.price * i.qty)}</div>
              </div>
              {i.extras && i.extras.length > 0 && <div className="small">+ {i.extras.map((e) => `${e.name} (${fmtMoney(currency, e.price)})`).join(", ")}</div>}
            </div>
          ))
        ) : (
          <div className="small">(no item detail — logged manually)</div>
        )}
        <hr className="divider" />
        <div className="row-between">
          <strong>Total</strong>
          <strong>{fmtMoney(currency, order.total)}</strong>
        </div>
        {order.notes && (
          <div className="small" style={{ marginTop: 8 }}>
            <strong>Notes:</strong> {order.notes}
          </div>
        )}
      </div>
    </div>
  );
}

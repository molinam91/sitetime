import { fmtDueDateTime, buildWaLink, buildSmsLink } from "../lib/business";

export default function Confirmation({ order, currency, whatsappNumber, onBackToMenu }) {
  return (
    <div>
      <div className="card" style={{ textAlign: "center" }}>
        <h2>🎉 Order placed!</h2>
        {order && <p style={{ fontWeight: 700 }}>📅 Ready by: {fmtDueDateTime(order.dueDate, order.dueTime)}</p>}
        <p className="small">Tap a button below to alert us right away — this is how we'll see your order.</p>
      </div>
      {order && whatsappNumber ? (
        <>
          <a className="btn wa block" href={buildWaLink(order, currency, whatsappNumber)} target="_blank" rel="noopener noreferrer" style={{ marginBottom: 10 }}>
            📱 Send via WhatsApp
          </a>
          <a className="btn secondary block" href={buildSmsLink(order, currency, whatsappNumber)}>
            💬 Send via Text Message
          </a>
        </>
      ) : (
        <div className="small" style={{ textAlign: "center" }}>
          (Contact number not set up yet by the baker)
        </div>
      )}
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button className="btn secondary" onClick={onBackToMenu}>
          Back to Menu
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
import {
  fmtMoney,
  fmtDateLong,
  dateToISO,
  getCutoffInfo,
  cartTotal,
  fiveDollarTierSubtotal,
  isFreeDeliveryEligible,
  twentyDollarBundleInfo,
  deliveryFeeForCart,
  orderTotal,
  promoFreeItemStatus,
  promoGrantsFreeDelivery,
  findPromoByCode,
  menuItemById,
  lineExtrasTotal,
  FREE_DELIVERY_TIER_THRESHOLD,
} from "../lib/business";
import { submitOrder } from "../lib/data";
import { toast } from "../lib/toast";

export default function Cart({ settings, menu, cart, setCart, appliedPromo, setAppliedPromo, onOrderPlaced }) {
  const [promoInput, setPromoInput] = useState(appliedPromo ? appliedPromo.code : "");
  const [fulfillment, setFulfillment] = useState("pickup");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const ids = Object.keys(cart);
  const currency = settings.currency;

  if (ids.length === 0) {
    return <div className="empty">Your cart is empty. Add something tasty!</div>;
  }

  const fiveSub = fiveDollarTierSubtotal(cart, menu);
  const eligible = isFreeDeliveryEligible(cart, menu);
  const bundleInfo = twentyDollarBundleInfo(cart, menu);
  const freeItemStatus = promoFreeItemStatus(appliedPromo, cart, menu);
  const freeDelivery = promoGrantsFreeDelivery(appliedPromo);
  const { readyDate, pushedLate } = getCutoffInfo();
  const isDelivery = fulfillment === "delivery";
  const deliveryFee = deliveryFeeForCart(cart, menu, appliedPromo, settings.deliveryFee);
  const total = orderTotal(cart, menu, appliedPromo, settings.deliveryFee, fulfillment);

  function applyPromo() {
    const found = findPromoByCode(settings.promoCodes, promoInput.trim());
    if (!found) {
      toast("Código no válido");
      setAppliedPromo(null);
      return;
    }
    setAppliedPromo(found);
    toast(`Código "${found.code}" aplicado ✓`);
  }

  async function placeOrder() {
    if (!name.trim() || !phone.trim()) {
      toast("Please fill in your name and phone");
      return;
    }
    if (isDelivery && !address.trim()) {
      toast("Please enter a delivery address");
      return;
    }
    setSubmitting(true);
    try {
      const items = Object.keys(cart).map((id) => {
        const it = menuItemById(menu, id);
        const entry = cart[id];
        const extras = (it.extras || []).filter((ex) => entry.extras && entry.extras[ex.id]).map((ex) => ({ name: ex.name, price: ex.price }));
        return { itemId: id, name: it.name, price: it.price, qty: entry.qty, extras };
      });
      if (freeItemStatus && freeItemStatus.qualifies) {
        items.push({ itemId: freeItemStatus.item.id, name: freeItemStatus.item.name + " (GRATIS — promo)", price: 0, qty: 1, extras: [] });
      }
      const promoUsed = appliedPromo && (freeDelivery || (freeItemStatus && freeItemStatus.qualifies)) ? appliedPromo.code : null;
      const order = {
        customerName: name.trim(),
        phone: phone.trim(),
        fulfillment,
        address: isDelivery ? address.trim() : "",
        deliveryFee: isDelivery ? deliveryFee : 0,
        dueDate: dateToISO(readyDate),
        dueTime: "",
        notes: notes.trim(),
        items,
        total,
        promoCode: promoUsed,
      };
      const { orderNumber } = await submitOrder(order);
      onOrderPlaced({ ...order, orderNumber });
      setCart({});
      setAppliedPromo(null);
    } catch (e) {
      toast("Could not place order — check your connection and try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="card">
        {ids.map((id) => {
          const it = menuItemById(menu, id);
          if (!it) return null;
          const entry = cart[id];
          const extrasNames = (it.extras || []).filter((ex) => entry.extras && entry.extras[ex.id]);
          const lineTotal = ((it.price || 0) + lineExtrasTotal(it, entry)) * entry.qty;
          return (
            <div key={id} style={{ marginBottom: 8 }}>
              <div className="row-between">
                <div>
                  {entry.qty}× {it.name}
                </div>
                <div>{fmtMoney(currency, lineTotal)}</div>
              </div>
              {extrasNames.length > 0 && <div className="small">+ {extrasNames.map((ex) => ex.name).join(", ")}</div>}
            </div>
          );
        })}
        <hr className="divider" />
        <div className="row-between">
          <span>Items subtotal</span>
          <span>{fmtMoney(currency, cartTotal(cart, menu))}</span>
        </div>
        {fiveSub > 0 && (
          <div className="small" style={eligible ? { color: "var(--good)", fontWeight: 700, marginTop: 6 } : { marginTop: 6 }}>
            {eligible
              ? `🎉 ¡Envío gratis! Ya tienes ${fmtMoney(currency, fiveSub)} en productos de $5`
              : `Agrega ${fmtMoney(currency, FREE_DELIVERY_TIER_THRESHOLD - fiveSub)} más en productos de $5 (gelatinas, arroz con leche) para envío gratis`}
          </div>
        )}
        {bundleInfo.savings > 0 && (
          <div className="small" style={{ color: "var(--good)", fontWeight: 700, marginTop: 6 }}>
            🎉 ¡Descuento aplicado! 2x$20 por $35 — ahorras {fmtMoney(currency, bundleInfo.savings)}
          </div>
        )}
        {bundleInfo.remainder === 1 && (
          <div className="small" style={{ marginTop: 6 }}>
            Agrega 1 producto más de $20 y llévate 2 por $35 (ahorras $5 más)
          </div>
        )}
        {isDelivery && (
          <div className="row-between">
            <span>Delivery fee</span>
            <span>{fmtMoney(currency, deliveryFee)}</span>
          </div>
        )}
        {freeItemStatus && (
          <div className="small" style={freeItemStatus.qualifies ? { color: "var(--good)", fontWeight: 700, marginTop: 6 } : { marginTop: 6 }}>
            {freeItemStatus.qualifies
              ? `🎁 ¡Código aplicado! ${freeItemStatus.item.name} gratis incluido`
              : `Código "${freeItemStatus.promo.code}" — agrega ${fmtMoney(currency, freeItemStatus.promo.minPurchase - cartTotal(cart, menu))} más para calificar por tu ${freeItemStatus.item.name} gratis`}
          </div>
        )}
        {freeDelivery && (
          <div className="small" style={{ color: "var(--good)", fontWeight: 700, marginTop: 6 }}>
            🎉 Código "{appliedPromo.code}" — envío gratis aplicado
          </div>
        )}
        <hr className="divider" />
        <div className="row-between">
          <strong>Total</strong>
          <strong>{fmtMoney(currency, total)}</strong>
        </div>
      </div>

      <div className="card">
        <label>¿Tienes un código de promoción?</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={promoInput} onChange={(e) => setPromoInput(e.target.value)} placeholder="Código" style={{ flex: 1 }} />
          <button className="btn secondary" style={{ flex: "none" }} onClick={applyPromo}>
            Aplicar
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Your details</h3>
        <label>Your name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        <label>Phone number</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="For confirmation" />
        <label>Pickup or Delivery?</label>
        <label className={`radio-option ${!isDelivery ? "selected" : ""}`}>
          <input type="radio" name="fulfillment" value="pickup" checked={!isDelivery} onChange={() => setFulfillment("pickup")} />
          <span>
            Pickup <span className="small">(free)</span>
          </span>
        </label>
        <label className={`radio-option ${isDelivery ? "selected" : ""}`}>
          <input type="radio" name="fulfillment" value="delivery" checked={isDelivery} onChange={() => setFulfillment("delivery")} />
          <span>
            Delivery{" "}
            <span className="small">
              {eligible || freeDelivery ? "(free — promo applied)" : `(+${fmtMoney(currency, settings.deliveryFee)})`}
            </span>
          </span>
        </label>
        {isDelivery && (
          <div>
            <label>Delivery address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city, zip" />
          </div>
        )}
        <div className="card" style={{ marginTop: 14, marginBottom: 0, background: "var(--input-bg)" }}>
          {pushedLate ? (
            <>
              <div style={{ fontWeight: 700, color: "var(--warn)" }}>⏰ This week's Wed 4pm order cutoff has passed</div>
              <div className="small">
                Your order will be ready: <strong>{fmtDateLong(readyDate)}</strong>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 700 }}>📅 Ready by: {fmtDateLong(readyDate)}</div>
              <div className="small">Orders must be in by Wed 4pm to be ready that Friday.</div>
            </>
          )}
        </div>
        <label>Notes (optional)</label>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, decorating requests, etc." />
        <button className="btn block" style={{ marginTop: 14 }} disabled={submitting} onClick={placeOrder}>
          {submitting ? "Placing order…" : "Place Order"}
        </button>
      </div>
    </div>
  );
}

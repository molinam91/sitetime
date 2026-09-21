// Pure business-logic functions ported from the original single-file app, kept behavior-identical.

export const BUNDLE_TIER_PRICE = 20;
export const BUNDLE_PAIR_PRICE = 35;
export const FREE_DELIVERY_TIER_PRICE = 5;
export const FREE_DELIVERY_TIER_THRESHOLD = 25;

export function fmtMoney(currency, n) {
  return currency + (Math.round((n || 0) * 100) / 100).toFixed(2);
}

export function fmtDueDateTime(dateStr, timeStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  let out = `${m}/${d}/${y}`;
  if (timeStr) {
    let [hh, mm] = timeStr.split(":").map(Number);
    const ampm = hh >= 12 ? "pm" : "am";
    hh = hh % 12;
    if (hh === 0) hh = 12;
    out += ` at ${hh}:${String(mm).padStart(2, "0")}${ampm}`;
  }
  return out;
}

export function dateToISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isoToDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function fmtDateLong(d) {
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

export function fmtPlaced(ts) {
  const d = new Date(ts);
  return (
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
  );
}

// Orders in by Wednesday 4pm -> ready that Friday. After the cutoff, pushed to the following Friday.
export function getCutoffInfo(now) {
  now = now || new Date();
  const day = now.getDay();
  const diffToWed = (3 - day + 7) % 7;
  let cutoff = new Date(now);
  cutoff.setDate(now.getDate() + diffToWed);
  cutoff.setHours(16, 0, 0, 0);
  if (now > cutoff) {
    cutoff = new Date(cutoff);
    cutoff.setDate(cutoff.getDate() + 7);
  }
  const readyDate = new Date(cutoff);
  readyDate.setDate(cutoff.getDate() + 2);
  readyDate.setHours(0, 0, 0, 0);

  const diffToFri = (5 - day + 7) % 7;
  const immediateFriday = new Date(now);
  immediateFriday.setDate(now.getDate() + diffToFri);
  immediateFriday.setHours(0, 0, 0, 0);

  const pushedLate = readyDate.getTime() !== immediateFriday.getTime();
  return { cutoff, readyDate, pushedLate };
}

export function upcomingFridayOptions(count) {
  const opts = [];
  const { readyDate } = getCutoffInfo();
  const d = new Date(readyDate);
  for (let i = 0; i < count; i++) {
    opts.push({ iso: dateToISO(d), label: fmtDateLong(d) });
    d.setDate(d.getDate() + 7);
  }
  return opts;
}

export function menuItemById(menu, id) {
  return menu.find((m) => m.id === id);
}

export function lineExtrasTotal(item, cartEntry) {
  if (!item || !item.extras || !cartEntry || !cartEntry.extras) return 0;
  return item.extras.reduce((sum, ex) => sum + (cartEntry.extras[ex.id] ? ex.price || 0 : 0), 0);
}

export function twentyDollarBundleInfo(cart, menu) {
  let qty = 0,
    extrasTotal = 0;
  Object.keys(cart).forEach((id) => {
    const item = menuItemById(menu, id);
    const entry = cart[id];
    if (item && entry && item.price === BUNDLE_TIER_PRICE) {
      qty += entry.qty;
      extrasTotal += lineExtrasTotal(item, entry) * entry.qty;
    }
  });
  const pairs = Math.floor(qty / 2);
  const remainder = qty % 2;
  const baseTotal = pairs * BUNDLE_PAIR_PRICE + remainder * BUNDLE_TIER_PRICE;
  const regularTotal = qty * BUNDLE_TIER_PRICE;
  return { qty, pairs, remainder, baseTotal, extrasTotal, savings: regularTotal - baseTotal };
}

export function cartTotal(cart, menu) {
  let total = 0;
  const bundle = twentyDollarBundleInfo(cart, menu);
  total += bundle.baseTotal + bundle.extrasTotal;
  Object.keys(cart).forEach((id) => {
    const item = menuItemById(menu, id);
    const entry = cart[id];
    if (!item || !entry) return;
    if (item.price === BUNDLE_TIER_PRICE) return; // already counted in the bundle above
    total += ((item.price || 0) + lineExtrasTotal(item, entry)) * entry.qty;
  });
  return total;
}

export function cartCount(cart) {
  return Object.values(cart).reduce((a, b) => a + (b.qty || 0), 0);
}

export function fiveDollarTierSubtotal(cart, menu) {
  let sum = 0;
  Object.keys(cart).forEach((id) => {
    const item = menuItemById(menu, id);
    const entry = cart[id];
    if (item && entry && item.price === FREE_DELIVERY_TIER_PRICE) sum += item.price * entry.qty;
  });
  return sum;
}

export function isFreeDeliveryEligible(cart, menu) {
  return fiveDollarTierSubtotal(cart, menu) >= FREE_DELIVERY_TIER_THRESHOLD;
}

export function findPromoByCode(promoCodes, code) {
  const norm = (code || "").trim().toLowerCase();
  if (!norm) return null;
  return (promoCodes || []).find((p) => p.code.trim().toLowerCase() === norm) || null;
}

export function promoGrantsFreeDelivery(appliedPromo) {
  return !!(appliedPromo && appliedPromo.type === "free_delivery");
}

export function promoFreeItemStatus(appliedPromo, cart, menu) {
  if (!appliedPromo || appliedPromo.type !== "free_item") return null;
  const item = menuItemById(menu, appliedPromo.itemId);
  if (!item) return null;
  const qualifies = cartTotal(cart, menu) >= (appliedPromo.minPurchase || 0);
  return { promo: appliedPromo, item, qualifies };
}

export function deliveryFeeForCart(cart, menu, appliedPromo, deliveryFee) {
  return isFreeDeliveryEligible(cart, menu) || promoGrantsFreeDelivery(appliedPromo) ? 0 : deliveryFee || 0;
}

export function orderTotal(cart, menu, appliedPromo, deliveryFee, fulfillment) {
  return cartTotal(cart, menu) + (fulfillment === "delivery" ? deliveryFeeForCart(cart, menu, appliedPromo, deliveryFee) : 0);
}

export function buildOrderMessage(o, currency) {
  const lines = o.items
    .map((i) => {
      let l = `- ${i.qty}x ${i.name} (${fmtMoney(currency, i.price * i.qty)})`;
      if (i.extras && i.extras.length) {
        l += `\n   + ${i.extras.map((e) => e.name + " (" + fmtMoney(currency, e.price) + ")").join(", ")}`;
      }
      return l;
    })
    .join("\n");
  const fulfillmentLine =
    o.fulfillment === "delivery"
      ? `Delivery (${o.deliveryFee > 0 ? "+" + fmtMoney(currency, o.deliveryFee) : "GRATIS 🎉"}) to: ${o.address}`
      : "Pickup";
  return `New order from ${o.customerName} (${o.phone})\nReady by: ${fmtDueDateTime(o.dueDate, o.dueTime)}\n${fulfillmentLine}\n\n${lines}\n\nTotal: ${fmtMoney(currency, o.total)}${
    o.promoCode ? "\nPromo code used: " + o.promoCode : ""
  }${o.notes ? "\nNotes: " + o.notes : ""}`;
}

export function buildWaLink(o, currency, whatsappNumber) {
  return `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(buildOrderMessage(o, currency))}`;
}

export function buildSmsLink(o, currency, whatsappNumber) {
  const num = whatsappNumber.replace(/[^0-9]/g, "");
  return `sms:${num}?&body=${encodeURIComponent(buildOrderMessage(o, currency))}`;
}

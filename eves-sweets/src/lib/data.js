import { useEffect, useRef, useState } from "react";
import { authedFetch } from "./auth";

const SETTINGS_URL = "/.netlify/functions/settings";
const MENU_URL = "/.netlify/functions/menu";
const ORDERS_URL = "/.netlify/functions/orders";

// Netlify Blobs has no real-time push like Firestore's onSnapshot, so every device polls
// instead. A write also calls invalidate() for its own URL so the tab that just made the
// change updates immediately rather than waiting out the poll interval — other devices still
// see it within one poll cycle, which is what "no caching ambiguity" means here: every poll
// is a fresh read, never a stale cached page.
let invalidateListeners = {};
function invalidate(url) {
  (invalidateListeners[url] || []).forEach((fn) => fn());
}
function onInvalidate(url, fn) {
  invalidateListeners[url] = invalidateListeners[url] || [];
  invalidateListeners[url].push(fn);
  return () => {
    invalidateListeners[url] = (invalidateListeners[url] || []).filter((f) => f !== fn);
  };
}

async function publicGet(url) {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function usePolled(url, { intervalMs, authed = false, fallback }) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    async function load() {
      try {
        const result = authed ? await authedFetch(url) : await publicGet(url);
        if (mountedRef.current) setData(result);
      } catch (e) {
        // keep showing the last-known-good data rather than clearing it on a transient error
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }
    load();
    const timer = setInterval(load, intervalMs);
    const unsubscribe = onInvalidate(url, load);
    return () => {
      mountedRef.current = false;
      clearInterval(timer);
      unsubscribe();
    };
  }, [url, intervalMs, authed]);

  return { data, loading };
}

export function useSettings() {
  const { data, loading } = usePolled(SETTINGS_URL, { intervalMs: 8000, fallback: {} });
  return { settings: data, loading };
}

export async function saveSettings(newSettings) {
  await authedFetch(SETTINGS_URL, { method: "POST", body: JSON.stringify(newSettings) });
  invalidate(SETTINGS_URL);
}

export function useMenu() {
  const { data, loading } = usePolled(MENU_URL, { intervalMs: 8000, fallback: [] });
  return { menu: data, loading };
}

export async function addMenuItem(item) {
  const created = await authedFetch(MENU_URL, { method: "POST", body: JSON.stringify(item) });
  invalidate(MENU_URL);
  return created;
}

export async function updateMenuItem(id, patch) {
  const updated = await authedFetch(MENU_URL, { method: "PUT", body: JSON.stringify({ id, patch }) });
  invalidate(MENU_URL);
  return updated;
}

export async function deleteMenuItem(id) {
  await authedFetch(`${MENU_URL}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  invalidate(MENU_URL);
}

export function useOrders() {
  const { data, loading } = usePolled(ORDERS_URL, { intervalMs: 5000, authed: true, fallback: [] });
  return { orders: data, loading };
}

export async function deleteOrder(id) {
  await authedFetch(`${ORDERS_URL}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  invalidate(ORDERS_URL);
}

export async function addManualOrder(order) {
  const res = await authedFetch(ORDERS_URL, { method: "POST", body: JSON.stringify({ ...order, source: "manual" }) });
  invalidate(ORDERS_URL);
  return res;
}

export async function submitOrder(order) {
  // Placing an order is the one write a never-signed-in customer makes, so this goes through
  // a plain fetch rather than authedFetch (which would attach a bearer token they don't have).
  const res = await fetch(ORDERS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...order, source: "customer" }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not place order");
  return data;
}

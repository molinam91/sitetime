import { useEffect, useState } from "react";

const TOKEN_KEY = "eveOwnerToken";
let listeners = [];

function notify() {
  listeners.forEach((l) => l());
}

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    /* ignore — worst case the owner has to log in again next visit */
  }
  notify();
}

// The client can't verify the token's signature (that needs SESSION_SECRET, which only the
// Netlify Functions have) — this is just an optimistic check so the dashboard doesn't flash
// its tabs open before bouncing back to the login screen. The real check happens server-side
// on every authed Function call; a 401 from any of them clears the token (see authedFetch).
function looksUnexpired(token) {
  try {
    const [payload] = token.split(".");
    const { exp } = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof exp === "number" && Date.now() < exp;
  } catch (e) {
    return false;
  }
}

export function useOwnerAuth() {
  const [user, setUser] = useState(undefined); // undefined = still checking, null = signed out
  useEffect(() => {
    const check = () => {
      const token = getToken();
      setUser(token && looksUnexpired(token) ? { token } : null);
    };
    check();
    listeners.push(check);
    return () => {
      listeners = listeners.filter((l) => l !== check);
    };
  }, []);
  return user;
}

export async function unlockWithPin(pin) {
  const res = await fetch("/.netlify/functions/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Wrong PIN");
  setToken(data.token);
}

export function lockDashboard() {
  setToken(null);
}

export async function changePin(newPin) {
  await authedFetch("/.netlify/functions/change-pin", {
    method: "POST",
    body: JSON.stringify({ newPin }),
  });
}

// Shared by src/lib/data.js for every dashboard-only (write) call. Attaches the bearer token
// and treats a 401 as "session's no longer valid" by clearing it, which flips useOwnerAuth
// back to signed-out on the next render.
export async function authedFetch(url, options = {}) {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}), Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    setToken(null);
    throw new Error("Session expired — please log in again");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

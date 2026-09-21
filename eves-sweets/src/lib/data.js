import { useEffect, useState } from "react";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const SETTINGS_DOC = doc(db, "settings", "main");
const ORDER_COUNTER_DOC = doc(db, "counters", "orders");

export const DEFAULT_SETTINGS = {
  businessName: "My Bakery",
  whatsappNumber: "",
  currency: "$",
  deliveryFee: 0,
  logo: null,
  promoCodes: [],
};

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = onSnapshot(SETTINGS_DOC, (snap) => {
      setSettings(snap.exists() ? { ...DEFAULT_SETTINGS, ...snap.data() } : DEFAULT_SETTINGS);
      setLoading(false);
    });
    return unsub;
  }, []);
  return { settings, loading };
}

export function saveSettings(newSettings) {
  return setDoc(SETTINGS_DOC, newSettings, { merge: false });
}

export function useMenu() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "menu"), (snap) => {
      setMenu(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);
  return { menu, loading };
}

export function addMenuItem(item) {
  return addDoc(collection(db, "menu"), item);
}

export function updateMenuItem(id, patch) {
  return updateDoc(doc(db, "menu", id), patch);
}

export function deleteMenuItem(id) {
  return deleteDoc(doc(db, "menu", id));
}

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "orders"), (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);
  return { orders, loading };
}

export function deleteOrder(id) {
  return deleteDoc(doc(db, "orders", id));
}

// Atomically grabs the next order number so it stays consistent across every device,
// replacing the old localStorage-based counter + copy/paste flow.
async function nextOrderNumber() {
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ORDER_COUNTER_DOC);
    const next = (snap.exists() ? snap.data().value : 0) + 1;
    tx.set(ORDER_COUNTER_DOC, { value: next });
    return next;
  });
}

export async function addManualOrder(order) {
  const orderNumber = await nextOrderNumber();
  return addDoc(collection(db, "orders"), { ...order, orderNumber, placedAt: Date.now(), source: "manual" });
}

export async function submitOrder(order) {
  const orderNumber = await nextOrderNumber();
  const docRef = await addDoc(collection(db, "orders"), {
    ...order,
    orderNumber,
    placedAt: Date.now(),
    createdAt: serverTimestamp(),
    source: "customer",
  });
  return { id: docRef.id, orderNumber };
}

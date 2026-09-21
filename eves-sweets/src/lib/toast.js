import { useEffect, useState } from "react";

let listeners = [];
let nextId = 1;

export function toast(msg) {
  const id = nextId++;
  listeners.forEach((l) => l(id, msg));
}

export function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

export function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const handler = (id, msg) => {
      setItems((prev) => [...prev, { id, msg }]);
      setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 4500);
    };
    listeners.push(handler);
    return () => {
      listeners = listeners.filter((l) => l !== handler);
    };
  }, []);
  return (
    <>
      {items.map((i, idx) => (
        <div className="toast" key={i.id} style={{ top: 14 + idx * 46 }}>
          {i.msg}
        </div>
      ))}
    </>
  );
}

import { useState } from "react";
import { unlockWithPin, lockDashboard } from "../lib/auth";
import { toast } from "../lib/toast";
import MenuEditor from "./MenuEditor";
import OrdersTab from "./OrdersTab";
import ShareTab from "./ShareTab";
import SettingsTab from "./SettingsTab";

function PinLogin() {
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      await unlockWithPin(pin);
    } catch (e) {
      toast(e.message || "Wrong PIN");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="wrap">
      <div className="pin-box">
        <h2>🔒 Baker Login</h2>
        <input
          type="password"
          placeholder="Enter PIN"
          style={{ textAlign: "center", fontSize: 20, letterSpacing: 4 }}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <button className="btn block" style={{ marginTop: 12 }} disabled={submitting} onClick={submit}>
          Unlock
        </button>
        <div style={{ marginTop: 16 }}>
          <a
            href="#"
            className="small"
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = "";
            }}
          >
            ← Back to ordering page
          </a>
        </div>
      </div>
    </div>
  );
}

export default function DashboardApp({ settings, menu, user }) {
  const [view, setView] = useState("dash-menu");

  if (user === undefined) {
    return (
      <div className="wrap">
        <div className="empty">Loading…</div>
      </div>
    );
  }
  if (user === null) {
    return <PinLogin />;
  }

  return (
    <>
      <header className="top">
        <div className="brand">
          {settings.logo ? <img className="brand-logo" src={settings.logo} alt="" /> : <span className="brand-emoji">🧑‍🍳</span>}
          <h1>{settings.businessName} Dashboard</h1>
        </div>
        <div className="tabs">
          <div className={`tab ${view === "dash-menu" ? "active" : ""}`} onClick={() => setView("dash-menu")}>
            Menu
          </div>
          <div className={`tab ${view === "dash-catering" ? "active" : ""}`} onClick={() => setView("dash-catering")}>
            Catering
          </div>
          <div className={`tab ${view === "dash-orders" ? "active" : ""}`} onClick={() => setView("dash-orders")}>
            Orders
          </div>
          <div className={`tab ${view === "dash-share" ? "active" : ""}`} onClick={() => setView("dash-share")}>
            Share / QR
          </div>
          <div className={`tab ${view === "dash-settings" ? "active" : ""}`} onClick={() => setView("dash-settings")}>
            Settings
          </div>
        </div>
      </header>
      <div className="wrap">
        {view === "dash-menu" && <MenuEditor category="menu" menu={menu} />}
        {view === "dash-catering" && <MenuEditor category="catering" menu={menu} />}
        {view === "dash-orders" && <OrdersTab currency={settings.currency} />}
        {view === "dash-share" && <ShareTab />}
        {view === "dash-settings" && <SettingsTab settings={settings} menu={menu} />}
        {view === "dash-settings" && (
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button className="btn ghost" onClick={() => lockDashboard()}>
              Log out
            </button>
          </div>
        )}
      </div>
    </>
  );
}

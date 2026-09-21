import { useEffect, useState, lazy, Suspense } from "react";
import { toast, Toaster } from "./lib/toast";
import { useSettings, useMenu } from "./lib/data";
import { useOwnerAuth } from "./lib/auth";
import CustomerApp from "./customer/CustomerApp";

// Lazy-loaded so customers, who never open the dashboard, don't pay for its bundle weight.
const DashboardApp = lazy(() => import("./dashboard/DashboardApp"));

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHashRoute();
  const user = useOwnerAuth();
  const { settings, loading: settingsLoading } = useSettings();
  const { menu, loading: menuLoading } = useMenu();

  useEffect(() => {
    const onError = (e) => toast("⚠️ Error: " + (e && e.message ? e.message : "unknown error"));
    const onRejection = (e) => toast("⚠️ Error: " + (e && e.reason ? e.reason.message || e.reason : "unknown error"));
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  const showDashboard = hash.startsWith("#dashboard");
  const loading = settingsLoading || menuLoading;

  return (
    <>
      {loading ? (
        <div className="wrap">
          <div className="empty">Loading…</div>
        </div>
      ) : showDashboard ? (
        <Suspense fallback={<div className="wrap"><div className="empty">Loading…</div></div>}>
          <DashboardApp settings={settings} menu={menu} user={user} />
        </Suspense>
      ) : (
        <CustomerApp settings={settings} menu={menu} />
      )}
      <Toaster />
    </>
  );
}

import { useRef, useState } from "react";
import { cartCount, cartTotal, fmtMoney, buildWaLink } from "../lib/business";
import ItemList from "./ItemList";
import Cart from "./Cart";
import Confirmation from "./Confirmation";

export default function CustomerApp({ settings, menu }) {
  const [view, setView] = useState("menu"); // menu | catering | cart | confirmed
  const [cart, setCart] = useState({});
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [lastOrder, setLastOrder] = useState(null);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);

  function handleLogoTap() {
    tapCountRef.current += 1;
    clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 1500);
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      window.location.hash = "#dashboard";
    }
  }

  function handleOrderPlaced(order) {
    setLastOrder(order);
    setView("confirmed");
    if (settings.whatsappNumber) {
      window.open(buildWaLink(order, settings.currency, settings.whatsappNumber), "_blank");
    }
  }

  const count = cartCount(cart);
  const showCartBar = view !== "cart" && view !== "confirmed" && count > 0;

  return (
    <>
      <header className="top">
        <div className="brand">
          {settings.logo ? (
            <img className="brand-logo" src={settings.logo} alt="" onClick={handleLogoTap} />
          ) : (
            <span className="brand-emoji" onClick={handleLogoTap}>
              🥐
            </span>
          )}
          <h1>{settings.businessName || "Bakery"}</h1>
        </div>
        <div className="tabs">
          <div className={`tab ${view === "menu" ? "active" : ""}`} onClick={() => setView("menu")}>
            Menu
          </div>
          <div className={`tab ${view === "catering" ? "active" : ""}`} onClick={() => setView("catering")}>
            Catering Packages
          </div>
          <div className={`tab ${view === "cart" ? "active" : ""}`} onClick={() => setView("cart")}>
            Cart
          </div>
        </div>
      </header>
      <div className="wrap">
        {view === "menu" && <ItemList category="menu" menu={menu} currency={settings.currency} cart={cart} setCart={setCart} />}
        {view === "catering" && <ItemList category="catering" menu={menu} currency={settings.currency} cart={cart} setCart={setCart} />}
        {view === "cart" && (
          <Cart
            settings={settings}
            menu={menu}
            cart={cart}
            setCart={setCart}
            appliedPromo={appliedPromo}
            setAppliedPromo={setAppliedPromo}
            onOrderPlaced={handleOrderPlaced}
          />
        )}
        {view === "confirmed" && (
          <Confirmation order={lastOrder} currency={settings.currency} whatsappNumber={settings.whatsappNumber} onBackToMenu={() => setView("menu")} />
        )}
      </div>
      {showCartBar && (
        <div className="cart-bar">
          <div>
            <span className="badge">{count}</span> item(s) — {fmtMoney(settings.currency, cartTotal(cart, menu))}
          </div>
          <button className="btn" onClick={() => setView("cart")}>
            View Cart
          </button>
        </div>
      )}
    </>
  );
}

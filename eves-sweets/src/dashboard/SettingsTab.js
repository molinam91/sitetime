import { useState } from "react";
import { saveSettings, addMenuItem } from "../lib/data";
import { resizeImageFile } from "../lib/image";
import { changePin } from "../lib/auth";
import { toast } from "../lib/toast";
import PromoCodesCard from "./PromoCodesCard";

function ImportSeedCard({ menu }) {
  const [importing, setImporting] = useState(false);
  if (menu.length > 0) return null;

  async function runImport() {
    setImporting(true);
    try {
      // Loaded on demand (not at module scope) so its ~500KB of bundled photos never ships
      // to customers who aren't the owner running this one-time import.
      const seedData = (await import("../data/seedData.json")).default;
      // Note: a free_item promo's itemId would need remapping to the new Firestore doc IDs
      // created below; the current live data only has a free_delivery code, so this is safe as-is.
      const s = seedData.settings;
      await saveSettings({
        businessName: s.businessName,
        whatsappNumber: s.whatsappNumber,
        currency: s.currency,
        deliveryFee: s.deliveryFee,
        logo: s.logo,
        promoCodes: s.promoCodes || [],
      });
      for (const item of seedData.menu) {
        const { id, ...rest } = item;
        await addMenuItem(rest);
      }
      toast(`Imported ${seedData.menu.length} items ✓`);
    } catch (e) {
      toast("Import failed — check your connection and try again");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="card">
      <h3>📦 Import your current live menu</h3>
      <p className="small">
        Your menu is empty. One-time import of the full menu and settings from the current live Claude Artifact page,
        so you don't have to re-enter everything by hand.
      </p>
      <button className="btn block" disabled={importing} onClick={runImport}>
        {importing ? "Importing…" : "Import current menu & settings"}
      </button>
    </div>
  );
}

function ChangePinCard() {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!pin || pin.length < 4) {
      toast("Choose a PIN of at least 4 characters");
      return;
    }
    if (pin !== confirmPin) {
      toast("PINs don't match");
      return;
    }
    setSaving(true);
    try {
      await changePin(pin);
      toast("PIN updated ✓");
      setPin("");
      setConfirmPin("");
    } catch (e) {
      toast("Could not change PIN — try logging out and back in, then retry");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <h3>Change Dashboard PIN</h3>
      <label>New PIN</label>
      <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} />
      <label>Confirm new PIN</label>
      <input type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} />
      <button className="btn block" style={{ marginTop: 12 }} disabled={saving} onClick={save}>
        Update PIN
      </button>
    </div>
  );
}

export default function SettingsTab({ settings, menu }) {
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [currency, setCurrency] = useState(settings.currency);
  const [deliveryFee, setDeliveryFee] = useState(settings.deliveryFee || 0);
  const [logo, setLogo] = useState(settings.logo || null);
  const [saving, setSaving] = useState(false);

  async function handleLogoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLogo(await resizeImageFile(file, 300));
  }

  async function save() {
    const newSettings = {
      ...settings,
      businessName: businessName.trim() || "My Bakery",
      whatsappNumber: whatsappNumber.trim(),
      currency: currency.trim() || "$",
      deliveryFee: parseFloat(deliveryFee) || 0,
      logo,
    };
    setSaving(true);
    try {
      await saveSettings(newSettings);
      toast("Saved!");
    } catch (e) {
      toast("Could not save — check your connection and try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <ImportSeedCard menu={menu} />
      <div className="card">
        <h3>Business Settings</h3>
        <label>Business name</label>
        <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        <label>WhatsApp / phone number (with country code, digits only, e.g. 15551234567)</label>
        <input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} />
        <label>Currency symbol</label>
        <input value={currency} onChange={(e) => setCurrency(e.target.value)} />
        <label>Delivery fee</label>
        <input type="number" step="0.01" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} />
        <label>Logo</label>
        {logo && <img className="img-upload-preview" src={logo} alt="" />}
        <input type="file" accept="image/*" onChange={handleLogoChange} />
        <button className="btn block" style={{ marginTop: 14 }} disabled={saving} onClick={save}>
          {saving ? "Saving…" : "Save Settings"}
        </button>
        <p className="small" style={{ marginTop: 10 }}>
          This number is used for both the WhatsApp alert and the regular text message option customers can use to notify you.
        </p>
      </div>
      <ChangePinCard />
      <PromoCodesCard settings={settings} menu={menu} />
    </div>
  );
}

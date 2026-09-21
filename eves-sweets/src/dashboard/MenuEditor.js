import { useState } from "react";
import { fmtMoney } from "../lib/business";
import { addMenuItem, updateMenuItem, deleteMenuItem } from "../lib/data";
import { resizeImageFile } from "../lib/image";
import { toast, uid } from "../lib/toast";

function AddItemForm({ category }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [serves, setServes] = useState("");
  const [image, setImage] = useState(null);
  const [extras, setExtras] = useState([]);
  const [extraName, setExtraName] = useState("");
  const [extraPrice, setExtraPrice] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImage(await resizeImageFile(file, 380));
  }

  function addExtra() {
    const trimmed = extraName.trim();
    const p = extraPrice.trim() === "" ? 0 : parseFloat(extraPrice);
    if (!trimmed || isNaN(p)) {
      toast("Enter a topping name (price can be left blank for free)");
      return;
    }
    setExtras((prev) => [...prev, { id: uid(), name: trimmed, price: p }]);
    setExtraName("");
    setExtraPrice("");
    toast(`Added "${trimmed}" ✓`);
  }

  async function submit() {
    const p = parseFloat(price);
    if (!name.trim() || isNaN(p)) {
      toast("Name and price are required");
      return;
    }
    const item = { name: name.trim(), description: description.trim(), price: p, category, active: true, image, extras };
    if (category === "catering") {
      const s = parseInt(serves, 10);
      if (!isNaN(s)) item.serves = s;
    }
    setSaving(true);
    try {
      await addMenuItem(item);
      setName("");
      setDescription("");
      setPrice("");
      setServes("");
      setImage(null);
      setExtras([]);
      toast("Added ✓");
    } catch (e) {
      toast("Could not save — check your connection and try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <h3>{category === "catering" ? "Add Catering Package" : "Add Menu Item"}</h3>
      <label>Name</label>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <label>Description</label>
      <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="grid2">
        <div>
          <label>Price</label>
          <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        {category === "catering" ? (
          <div>
            <label>Serves (people)</label>
            <input type="number" value={serves} onChange={(e) => setServes(e.target.value)} />
          </div>
        ) : (
          <div />
        )}
      </div>
      <label>Photo (optional)</label>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      {image && <img className="img-upload-preview" src={image} alt="" />}
      <label>Extras / Add-ons (optional)</label>
      <div>
        {extras.map((ex, idx) => (
          <div className="row-between" style={{ marginTop: 4 }} key={ex.id}>
            <div className="small">
              {ex.name} — {fmtMoney("$", ex.price)}
            </div>
            <button type="button" className="btn ghost" onClick={() => setExtras((prev) => prev.filter((_, i) => i !== idx))}>
              remove
            </button>
          </div>
        ))}
      </div>
      <div className="grid2" style={{ marginTop: 4 }}>
        <input placeholder="e.g. Fresh fruit topping" value={extraName} onChange={(e) => setExtraName(e.target.value)} />
        <input type="number" step="0.01" placeholder="Price" value={extraPrice} onChange={(e) => setExtraPrice(e.target.value)} />
      </div>
      <button type="button" className="btn secondary" style={{ marginTop: 8 }} onClick={addExtra}>
        + Add Extra
      </button>
      <button type="button" className="btn block" style={{ marginTop: 12 }} disabled={saving} onClick={submit}>
        {saving ? "Saving…" : `Add ${category === "catering" ? "Package" : "Item"}`}
      </button>
    </div>
  );
}

function EditItemBox({ item, category, onDone }) {
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description || "");
  const [price, setPrice] = useState(item.price);
  const [serves, setServes] = useState(item.serves || "");
  const [image, setImage] = useState(item.image || null);
  const [saving, setSaving] = useState(false);

  async function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImage(await resizeImageFile(file, 380));
  }

  async function save() {
    const p = parseFloat(price);
    if (!name.trim() || isNaN(p)) {
      toast("Name and price are required");
      return;
    }
    const patch = { name: name.trim(), description: description.trim(), price: p, image };
    if (category === "catering") {
      const s = parseInt(serves, 10);
      patch.serves = isNaN(s) ? null : s;
    }
    setSaving(true);
    try {
      await updateMenuItem(item.id, patch);
      onDone();
    } catch (e) {
      toast("Could not save — check your connection and try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <hr className="divider" />
      <label>Name</label>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <label>Description</label>
      <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="grid2">
        <div>
          <label>Price</label>
          <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        {category === "catering" ? (
          <div>
            <label>Serves</label>
            <input type="number" value={serves} onChange={(e) => setServes(e.target.value)} />
          </div>
        ) : (
          <div />
        )}
      </div>
      <label>Photo</label>
      {image && <img className="img-upload-preview" src={image} alt="" />}
      <input type="file" accept="image/*" onChange={handleImageChange} />
      {image && (
        <button className="btn ghost" onClick={() => setImage(null)}>
          Remove photo
        </button>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button className="btn block" disabled={saving} onClick={save}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
        <button className="btn secondary" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function ExtrasBox({ item, onDone }) {
  const [draftExtras, setDraftExtras] = useState((item.extras || []).map((ex) => ({ ...ex })));
  const [extraName, setExtraName] = useState("");
  const [extraPrice, setExtraPrice] = useState("");
  const [saving, setSaving] = useState(false);

  function handleAddExtra() {
    const trimmed = extraName.trim();
    const p = extraPrice.trim() === "" ? 0 : parseFloat(extraPrice);
    if (!trimmed || isNaN(p)) {
      toast("Enter a topping name (price can be left blank for free)");
      return;
    }
    setDraftExtras((prev) => [...prev, { id: uid(), name: trimmed, price: p }]);
    setExtraName("");
    setExtraPrice("");
    toast(`Added "${trimmed}" to the list ✓ (don't forget to tap Save Extras)`);
  }

  async function save() {
    setSaving(true);
    try {
      await updateMenuItem(item.id, { extras: draftExtras });
      onDone();
    } catch (e) {
      toast("Could not save — check your connection and try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <hr className="divider" />
      <div className="small" style={{ fontWeight: 600 }}>
        Extras / Add-ons
      </div>
      <div className="small" style={{ margin: "2px 0 6px" }}>
        {draftExtras.length} topping(s) ready to save
      </div>
      {draftExtras.length === 0 && <div className="small">None yet.</div>}
      {draftExtras.map((ex) => (
        <div className="row-between" style={{ marginTop: 4 }} key={ex.id}>
          <div className="small">
            {ex.name} — {fmtMoney("$", ex.price)}
          </div>
          <button className="btn ghost" onClick={() => setDraftExtras((prev) => prev.filter((x) => x.id !== ex.id))}>
            remove
          </button>
        </div>
      ))}
      <hr className="divider" />
      <div className="small" style={{ fontWeight: 600, marginBottom: 4 }}>
        Add a topping
      </div>
      <div className="grid2">
        <input placeholder="e.g. Sprinkles" value={extraName} onChange={(e) => setExtraName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddExtra()} />
        <input type="number" step="0.01" placeholder="Price (optional)" value={extraPrice} onChange={(e) => setExtraPrice(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddExtra()} />
      </div>
      <button type="button" className="btn block" style={{ marginTop: 8, background: "var(--good)", color: "#fff" }} onClick={handleAddExtra}>
        ➕ Add This Topping to the List
      </button>
      <hr className="divider" />
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" className="btn block" disabled={saving} onClick={save}>
          💾 Save Extras ({draftExtras.length})
        </button>
        <button type="button" className="btn secondary" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function MenuItemRow({ item, category }) {
  const [openBox, setOpenBox] = useState(null); // null | "edit" | "extras"
  const [deleteArmed, setDeleteArmed] = useState(false);

  async function toggleActive() {
    try {
      await updateMenuItem(item.id, { active: item.active === false ? true : false });
    } catch (e) {
      toast("Could not save — check your connection and try again");
    }
  }

  async function handleDelete() {
    if (!deleteArmed) {
      setDeleteArmed(true);
      setTimeout(() => setDeleteArmed(false), 3000);
      return;
    }
    try {
      await deleteMenuItem(item.id);
    } catch (e) {
      toast("Could not delete — check your connection and try again");
    }
  }

  return (
    <div className="card">
      <div className="item-row">
        {item.image ? <img className="item-img" src={item.image} alt="" /> : <div className="item-emoji-ph">🍞</div>}
        <div className="item-info">
          <h3>{item.name}</h3>
          <div className="desc">{item.description || ""}</div>
          <div className="price">{fmtMoney("$", item.price)}</div>
        </div>
      </div>
      {openBox === "edit" && <EditItemBox item={item} category={category} onDone={() => setOpenBox(null)} />}
      {openBox === "extras" && <ExtrasBox item={item} onDone={() => setOpenBox(null)} />}
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <button className="btn secondary" style={{ flex: 1 }} onClick={() => setOpenBox(openBox === "edit" ? null : "edit")}>
          Edit
        </button>
        <button className="btn secondary" style={{ flex: 1 }} onClick={toggleActive}>
          {item.active === false ? "Show on menu" : "Hide from menu"}
        </button>
        <button className="btn secondary" style={{ flex: 1 }} onClick={() => setOpenBox(openBox === "extras" ? null : "extras")}>
          Extras ({(item.extras || []).length})
        </button>
        <button className="btn secondary" style={{ flex: 1 }} onClick={handleDelete}>
          {deleteArmed ? "Tap again to confirm" : "Delete"}
        </button>
      </div>
    </div>
  );
}

export default function MenuEditor({ category, menu }) {
  const items = menu.filter((it) => (it.category || "menu") === category).sort((a, b) => (b.price || 0) - (a.price || 0));
  return (
    <div>
      <AddItemForm category={category} />
      {items.length === 0 && <div className="empty">Nothing added yet.</div>}
      {items.map((it) => (
        <MenuItemRow key={it.id} item={it} category={category} />
      ))}
    </div>
  );
}

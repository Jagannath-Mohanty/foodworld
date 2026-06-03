import React, { useCallback, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { MdStorefront, MdPhone, MdEmail, MdLocationOn, MdEdit } from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import { NotificationContext } from "../../context/NotificationContext";
import ImagePicker from "../../components/ImagePicker/ImagePicker";
import { api, R } from "../../lib/api";

const Row = ({ icon, label, children }) => (
  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}>
    <span style={{ color: "var(--color-text-muted)", fontSize: "1.2rem", marginTop: 1 }}>{icon}</span>
    <div>
      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      <div style={{ fontSize: "0.92rem", color: "var(--color-text)" }}>{children || "—"}</div>
    </div>
  </div>
);

const toForm = (r) => ({
  name: r.name || "",
  description: r.description || "",
  cuisines: (r.cuisines || []).join(", "),
  email: r.email || "",
  image: r.image || "",
  coverImage: r.coverImage || "",
  street: r.address?.street || "",
  city: r.address?.city || "",
  state: r.address?.state || "",
  pincode: r.address?.pincode || "",
  openTime: r.openHours?.open || "09:00",
  closeTime: r.openHours?.close || "23:00",
  deliveryFee: r.deliveryFee ?? "",
  minOrderAmount: r.minOrderAmount ?? "",
  priceForTwo: r.priceForTwo ?? "",
  avgDeliveryTimeMins: r.avgDeliveryTimeMins ?? "",
  isVegOnly: !!r.isVegOnly,
});

const Profile = () => {
  const { restaurant, updateRestaurant } = useContext(AuthContext);
  const { push } = useContext(NotificationContext);
  const location = useLocation();
  const isAccount = location.pathname === "/account";

  const [full, setFull] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(toForm({}));
  const [saving, setSaving] = useState(false);

  const id = restaurant?._id;

  const loadProfile = useCallback(async () => {
    if (!id) return;
    try {
      const r = await api.get(`${R}/${id}/profile`);
      setFull(r);
    } catch {
      /* fall back to the cached auth profile */
    }
  }, [id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const r = full || restaurant || {};
  const addr = r.address;

  const startEdit = () => {
    setForm(toForm(r));
    setEditing(true);
  };

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      push({ type: "error", message: "Name is required" });
      return;
    }
    setSaving(true);
    const num = (v) => (v === "" ? undefined : Number(v));
    const payload = {
      name: form.name,
      description: form.description,
      cuisines: form.cuisines ? form.cuisines.split(",").map((c) => c.trim()).filter(Boolean) : [],
      email: form.email || undefined,
      image: form.image || undefined,
      coverImage: form.coverImage || undefined,
      address: { street: form.street, city: form.city, state: form.state, pincode: form.pincode },
      openHours: { open: form.openTime, close: form.closeTime },
      deliveryFee: num(form.deliveryFee),
      minOrderAmount: num(form.minOrderAmount),
      priceForTwo: num(form.priceForTwo),
      avgDeliveryTimeMins: num(form.avgDeliveryTimeMins),
      isVegOnly: form.isVegOnly,
    };
    try {
      const data = await api.patch(`${R}/${id}/profile`, payload);
      setFull(data.restaurant);
      updateRestaurant({ name: data.restaurant.name, image: data.restaurant.image });
      setEditing(false);
      push({ type: "success", message: "Profile updated" });
    } catch (err) {
      push({ type: "error", message: err.message || "Could not update profile" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{isAccount ? "My Account" : "Profile"}</h1>
          <p>Your restaurant’s details on FoodWorld.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className={`badge ${r.isActive ? "badge-success" : "badge-warning"}`}>
            {r.isActive ? "Live" : "Paused"}
          </span>
          {!editing && (
            <button className="btn btn-primary" onClick={startEdit}>
              <MdEdit /> Edit profile
            </button>
          )}
        </div>
      </div>

      {!editing ? (
        /* ===== View mode ===== */
        <div className="card" style={{ maxWidth: 640 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
            <div
              style={{
                width: 64, height: 64, borderRadius: 14, overflow: "hidden", flexShrink: 0,
                background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem",
              }}
            >
              {r.image ? (
                <img src={r.image} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <MdStorefront />
              )}
            </div>
            <div>
              <h2 style={{ fontSize: "1.3rem" }}>{r.name || "Your restaurant"}</h2>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                {(r.cuisines || []).join(" · ") || "No cuisines set"}
              </p>
            </div>
          </div>

          {r.description && (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginBottom: 14 }}>
              {r.description}
            </p>
          )}

          <Row icon={<MdPhone />} label="Phone">{r.phone}</Row>
          <Row icon={<MdEmail />} label="Email">{r.email}</Row>
          <Row icon={<MdLocationOn />} label="Address">
            {addr ? `${addr.street || ""}, ${addr.city || ""} ${addr.pincode || ""}`.trim() : null}
          </Row>
          <Row icon={<MdStorefront />} label="Hours">
            {r.openHours ? `${r.openHours.open} – ${r.openHours.close}` : null}
          </Row>
          <Row icon={<MdStorefront />} label="Delivery">
            {r.deliveryFee != null ? `₹${r.deliveryFee} fee · ${r.avgDeliveryTimeMins || "—"} mins` : null}
          </Row>
        </div>
      ) : (
        /* ===== Edit mode ===== */
        <form onSubmit={save} className="card" style={{ maxWidth: 720 }}>
          <div className="form-grid">
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              <span>Restaurant name *</span>
              <input value={form.name} onChange={set("name")} required />
            </label>
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              <span>Description</span>
              <textarea value={form.description} onChange={set("description")} />
            </label>

            <label className="field">
              <span>Cuisines (comma separated)</span>
              <input value={form.cuisines} onChange={set("cuisines")} placeholder="Indian, Chinese" />
            </label>
            <label className="field">
              <span>Email</span>
              <input type="email" value={form.email} onChange={set("email")} />
            </label>

            <label className="field">
              <span>Logo image</span>
              <ImagePicker
                value={form.image}
                onChange={(v) => setForm((f) => ({ ...f, image: v }))}
                onError={(m) => push({ type: "error", message: m })}
              />
            </label>
            <label className="field">
              <span>Cover image</span>
              <ImagePicker
                value={form.coverImage}
                onChange={(v) => setForm((f) => ({ ...f, coverImage: v }))}
                onError={(m) => push({ type: "error", message: m })}
              />
            </label>

            <label className="field" style={{ gridColumn: "1 / -1" }}>
              <span>Street</span>
              <input value={form.street} onChange={set("street")} />
            </label>
            <label className="field">
              <span>City</span>
              <input value={form.city} onChange={set("city")} />
            </label>
            <label className="field">
              <span>State</span>
              <input value={form.state} onChange={set("state")} />
            </label>
            <label className="field">
              <span>Pincode</span>
              <input value={form.pincode} onChange={set("pincode")} />
            </label>

            <div className="field-row">
              <label className="field">
                <span>Opens</span>
                <input type="time" value={form.openTime} onChange={set("openTime")} />
              </label>
              <label className="field">
                <span>Closes</span>
                <input type="time" value={form.closeTime} onChange={set("closeTime")} />
              </label>
            </div>

            <label className="field">
              <span>Delivery fee (₹)</span>
              <input type="number" min="0" value={form.deliveryFee} onChange={set("deliveryFee")} />
            </label>
            <label className="field">
              <span>Min order (₹)</span>
              <input type="number" min="0" value={form.minOrderAmount} onChange={set("minOrderAmount")} />
            </label>
            <label className="field">
              <span>Price for two (₹)</span>
              <input type="number" min="0" value={form.priceForTwo} onChange={set("priceForTwo")} />
            </label>
            <label className="field">
              <span>Avg delivery time (mins)</span>
              <input type="number" min="0" value={form.avgDeliveryTimeMins} onChange={set("avgDeliveryTimeMins")} />
            </label>

            <label
              className="field"
              style={{ flexDirection: "row", alignItems: "center", gap: 8, gridColumn: "1 / -1" }}
            >
              <input type="checkbox" checked={form.isVegOnly} onChange={set("isVegOnly")} />
              <span>Pure veg restaurant</span>
            </label>
          </div>

          <div className="modal-actions" style={{ marginTop: 18 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </>
  );
};

export default Profile;

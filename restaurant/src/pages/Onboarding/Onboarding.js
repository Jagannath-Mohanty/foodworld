import React, { useContext, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { NotificationContext } from "../../context/NotificationContext";
import { api, R } from "../../lib/api";
import ImagePicker from "../../components/ImagePicker/ImagePicker";

const empty = {
  name: "",
  description: "",
  cuisines: "",
  email: "",
  image: "",
  coverImage: "",
  deliveryFee: "",
  minOrderAmount: "",
  priceForTwo: "",
  avgDeliveryTimeMins: "",
  street: "",
  city: "",
  state: "",
  pincode: "",
  openTime: "09:00",
  closeTime: "23:00",
  latitude: "",
  longitude: "",
  isVegOnly: false,
};

const Onboarding = () => {
  const { restaurant, isOnboarded, updateRestaurant } = useContext(AuthContext);
  const { push } = useContext(NotificationContext);
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);

  // Listing already completed → no need to onboard again.
  if (isOnboarded) return <Navigate to="/dashboard" replace />;

  const set = (k) => (e) =>
    setForm((f) => ({
      ...f,
      [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const num = (v) => (v === "" ? undefined : Number(v));
    const payload = {
      name: form.name,
      description: form.description,
      cuisines: form.cuisines
        ? form.cuisines.split(",").map((c) => c.trim()).filter(Boolean)
        : [],
      email: form.email || undefined,
      image: form.image || undefined,
      coverImage: form.coverImage || undefined,
      deliveryFee: num(form.deliveryFee),
      minOrderAmount: num(form.minOrderAmount),
      priceForTwo: num(form.priceForTwo),
      avgDeliveryTimeMins: num(form.avgDeliveryTimeMins),
      address: {
        street: form.street,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      },
      openHours: { open: form.openTime, close: form.closeTime },
      isVegOnly: form.isVegOnly,
    };
    if (form.latitude !== "" && form.longitude !== "") {
      payload.location = {
        type: "Point",
        coordinates: [Number(form.longitude), Number(form.latitude)],
      };
    }

    try {
      const data = await api.patch(`${R}/onboard/${restaurant._id}`, payload);
      const updated = data.restaurant || {};
      updateRestaurant({
        name: updated.name ?? form.name,
        isActive: updated.isActive ?? true,
      });
      push({ type: "success", message: "Restaurant is live!" });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      push({ type: "error", message: err.message || "Could not save details" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="al-page" style={{ alignItems: "flex-start", overflowY: "auto" }}>
      <div
        className="card"
        style={{ width: "100%", maxWidth: 720, margin: "32px auto" }}
      >
        <div className="page-head" style={{ marginBottom: 18 }}>
          <div>
            <h1>Set up your restaurant</h1>
            <p>Complete your listing so customers can find and order from you.</p>
          </div>
        </div>

        <form onSubmit={submit} className="form-grid">
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            <span>Restaurant name *</span>
            <input value={form.name} onChange={set("name")} required placeholder="Spice Route" />
          </label>

          <label className="field" style={{ gridColumn: "1 / -1" }}>
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={set("description")}
              placeholder="Authentic North Indian comfort food."
            />
          </label>

          <label className="field">
            <span>Cuisines (comma separated)</span>
            <input value={form.cuisines} onChange={set("cuisines")} placeholder="Indian, Chinese" />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={set("email")} placeholder="hello@spice.com" />
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

          <label className="field">
            <span>Delivery fee (₹)</span>
            <input type="number" min="0" value={form.deliveryFee} onChange={set("deliveryFee")} />
          </label>
          <label className="field">
            <span>Min order amount (₹)</span>
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

          <label className="field" style={{ gridColumn: "1 / -1" }}>
            <span>Street *</span>
            <input value={form.street} onChange={set("street")} required placeholder="12 MG Road" />
          </label>

          <label className="field">
            <span>City *</span>
            <input value={form.city} onChange={set("city")} required />
          </label>
          <label className="field">
            <span>State *</span>
            <input value={form.state} onChange={set("state")} required />
          </label>

          <label className="field">
            <span>Pincode *</span>
            <input value={form.pincode} onChange={set("pincode")} required />
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
            <span>Latitude (optional)</span>
            <input value={form.latitude} onChange={set("latitude")} placeholder="12.9716" />
          </label>
          <label className="field">
            <span>Longitude (optional)</span>
            <input value={form.longitude} onChange={set("longitude")} placeholder="77.5946" />
          </label>

          <label
            className="field"
            style={{ flexDirection: "row", alignItems: "center", gap: 8, gridColumn: "1 / -1" }}
          >
            <input type="checkbox" checked={form.isVegOnly} onChange={set("isVegOnly")} />
            <span>Pure veg restaurant</span>
          </label>

          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving…" : "Go live"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;

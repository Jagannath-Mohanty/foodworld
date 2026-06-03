import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { MdArrowBack } from "react-icons/md";
import { api } from "../../lib/api";
import ImagePicker from "../../components/ImagePicker/ImagePicker";
import { NotificationContext } from "../../context/NotificationContext";

const empty = {
  name: "",
  description: "",
  cuisines: "", // comma-separated in UI; converted on submit
  image: "",
  coverImage: "",
  phone: "",
  email: "",
  street: "",
  city: "",
  state: "",
  pincode: "",
  lat: "",
  lng: "",
  open: "09:00",
  close: "23:00",
  deliveryFee: 0,
  minOrderAmount: 0,
  avgDeliveryTimeMins: 30,
  priceForTwo: 0,
  tags: "",
  isVegOnly: false,
  isActive: true,
};

const RestaurantForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { push } = useContext(NotificationContext);

  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const r = await api.get(`/restaurants/${id}`);
        setForm({
          name: r.name || "",
          description: r.description || "",
          cuisines: (r.cuisines || []).join(", "),
          image: r.image || "",
          coverImage: r.coverImage || "",
          phone: r.phone || "",
          email: r.email || "",
          street: r.address?.street || "",
          city: r.address?.city || "",
          state: r.address?.state || "",
          pincode: r.address?.pincode || "",
          lat: r.location?.coordinates?.[1] ?? "",
          lng: r.location?.coordinates?.[0] ?? "",
          open: r.openHours?.open || "09:00",
          close: r.openHours?.close || "23:00",
          deliveryFee: r.deliveryFee ?? 0,
          minOrderAmount: r.minOrderAmount ?? 0,
          avgDeliveryTimeMins: r.avgDeliveryTimeMins ?? 30,
          priceForTwo: r.priceForTwo ?? 0,
          tags: (r.tags || []).join(", "),
          isVegOnly: !!r.isVegOnly,
          isActive: !!r.isActive,
        });
      } catch (err) {
        push({ type: "error", message: err.message });
      } finally {
        setLoading(false);
      }
    })();
  }, [id, push]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.image) {
      push({ type: "error", message: "Please upload a thumbnail image" });
      return;
    }
    setSubmitting(true);

    const payload = {
      name: form.name,
      description: form.description,
      cuisines: form.cuisines.split(",").map((s) => s.trim()).filter(Boolean),
      image: form.image,
      coverImage: form.coverImage,
      phone: form.phone,
      email: form.email,
      address: {
        street: form.street,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      },
      location: {
        type: "Point",
        coordinates: [Number(form.lng) || 0, Number(form.lat) || 0],
      },
      openHours: { open: form.open, close: form.close },
      deliveryFee: Number(form.deliveryFee) || 0,
      minOrderAmount: Number(form.minOrderAmount) || 0,
      avgDeliveryTimeMins: Number(form.avgDeliveryTimeMins) || 30,
      priceForTwo: Number(form.priceForTwo) || 0,
      tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
      isVegOnly: !!form.isVegOnly,
      isActive: !!form.isActive,
    };

    try {
      if (id) {
        await api.put(`/restaurants/${id}`, payload);
        push({ type: "success", message: "Restaurant updated" });
      } else {
        await api.post(`/restaurants`, payload);
        push({ type: "success", message: "Restaurant created" });
      }
      navigate("/restaurants");
    } catch (err) {
      push({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="state">Loading…</div>;

  return (
    <div>
      <div className="page-head">
        <div>
          <Link to="/restaurants" style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
            <MdArrowBack /> Back to restaurants
          </Link>
          <h1 style={{ marginTop: 4 }}>{id ? "Edit restaurant" : "New restaurant"}</h1>
        </div>
      </div>

      <form onSubmit={submit} className="card">
        <div className="form-grid">
          <label className="field">
            <span>Name</span>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </label>
          <label className="field">
            <span>Phone</span>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
          </label>
        </div>

        <div className="form-grid" style={{ marginTop: 14 }}>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
            />
          </label>
        </div>

        <div className="form-grid" style={{ marginTop: 14 }}>
          <label className="field">
            <span>Thumbnail image</span>
            <ImagePicker
              value={form.image}
              onChange={(v) => set("image", v)}
              onError={(m) => push({ type: "error", message: m })}
            />
          </label>
          <label className="field">
            <span>Cover image</span>
            <ImagePicker
              value={form.coverImage}
              onChange={(v) => set("coverImage", v)}
              onError={(m) => push({ type: "error", message: m })}
            />
          </label>
        </div>

        <div className="form-grid" style={{ marginTop: 14 }}>
          <label className="field">
            <span>Cuisines (comma-separated)</span>
            <input value={form.cuisines} onChange={(e) => set("cuisines", e.target.value)} />
          </label>
          <label className="field">
            <span>Tags (comma-separated)</span>
            <input value={form.tags} onChange={(e) => set("tags", e.target.value)} />
          </label>
        </div>

        <h3 style={{ marginTop: 22, marginBottom: 8, fontSize: "0.95rem" }}>Address</h3>
        <div className="form-grid">
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            <span>Street</span>
            <input value={form.street} onChange={(e) => set("street", e.target.value)} required />
          </label>
          <label className="field">
            <span>City</span>
            <input value={form.city} onChange={(e) => set("city", e.target.value)} required />
          </label>
          <label className="field">
            <span>State</span>
            <input value={form.state} onChange={(e) => set("state", e.target.value)} required />
          </label>
          <label className="field">
            <span>Pincode</span>
            <input value={form.pincode} onChange={(e) => set("pincode", e.target.value)} required />
          </label>
          <label className="field">
            <span>Latitude</span>
            <input type="number" step="any" value={form.lat} onChange={(e) => set("lat", e.target.value)} required />
          </label>
          <label className="field">
            <span>Longitude</span>
            <input type="number" step="any" value={form.lng} onChange={(e) => set("lng", e.target.value)} required />
          </label>
        </div>

        <h3 style={{ marginTop: 22, marginBottom: 8, fontSize: "0.95rem" }}>Operations</h3>
        <div className="form-grid">
          <label className="field">
            <span>Opens at</span>
            <input type="time" value={form.open} onChange={(e) => set("open", e.target.value)} />
          </label>
          <label className="field">
            <span>Closes at</span>
            <input type="time" value={form.close} onChange={(e) => set("close", e.target.value)} />
          </label>
          <label className="field">
            <span>Delivery fee (₹)</span>
            <input type="number" min="0" value={form.deliveryFee} onChange={(e) => set("deliveryFee", e.target.value)} />
          </label>
          <label className="field">
            <span>Min order (₹)</span>
            <input type="number" min="0" value={form.minOrderAmount} onChange={(e) => set("minOrderAmount", e.target.value)} />
          </label>
          <label className="field">
            <span>Avg delivery time (mins)</span>
            <input type="number" min="0" value={form.avgDeliveryTimeMins} onChange={(e) => set("avgDeliveryTimeMins", e.target.value)} />
          </label>
          <label className="field">
            <span>Price for two (₹)</span>
            <input type="number" min="0" value={form.priceForTwo} onChange={(e) => set("priceForTwo", e.target.value)} />
          </label>
        </div>

        <div className="form-grid" style={{ marginTop: 14 }}>
          <label className="field">
            <span style={{ marginBottom: 4 }}>Pure veg only</span>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={form.isVegOnly} onChange={(e) => set("isVegOnly", e.target.checked)} />
              Mark this restaurant as 100% vegetarian
            </label>
          </label>
          <label className="field">
            <span style={{ marginBottom: 4 }}>Active</span>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
              Visible to customers
            </label>
          </label>
        </div>

        <div className="modal-actions" style={{ marginTop: 24 }}>
          <Link to="/restaurants" className="btn btn-secondary">Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saving…" : id ? "Save changes" : "Create restaurant"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RestaurantForm;

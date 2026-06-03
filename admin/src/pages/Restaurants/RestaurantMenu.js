import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MdArrowBack, MdAdd, MdDelete, MdEdit, MdClose } from "react-icons/md";
import { api } from "../../lib/api";
import ImagePicker from "../../components/ImagePicker/ImagePicker";
import { NotificationContext } from "../../context/NotificationContext";

const blank = {
  name: "",
  description: "",
  image: "",
  category: "",
  price: "",
  isVeg: true,
  available: true,
};

const RestaurantMenu = () => {
  const { id } = useParams();
  const { push } = useContext(NotificationContext);

  const [restaurant, setRestaurant] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState(blank);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, menu] = await Promise.all([
        api.get(`/restaurants/${id}`),
        api.get(`/restaurants/${id}/menu`),
      ]);
      setRestaurant(r);
      setItems(menu.items || []);
    } catch (err) {
      push({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }, [id, push]);

  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setEdit = (k, v) => setEditForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.image) {
      push({ type: "error", message: "Please upload an item image" });
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/restaurants/${id}/menu`, {
        ...form,
        price: Number(form.price) || 0,
      });
      push({ type: "success", message: "Menu item added" });
      setForm(blank);
      load();
    } catch (err) {
      push({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    try {
      await api.del(`/menu-items/${item._id}`);
      push({ type: "success", message: "Menu item deleted" });
      load();
    } catch (err) {
      push({ type: "error", message: err.message });
    }
  };

  const startEdit = (item) => {
    setEditing(item);
    setEditForm({
      name: item.name || "",
      description: item.description || "",
      image: item.image || "",
      category: item.category || "",
      price: String(item.price ?? ""),
      isVeg: item.isVeg !== false,
      available: item.available !== false,
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setEditForm(null);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editForm?.image) {
      push({ type: "error", message: "Please upload an item image" });
      return;
    }
    setSavingEdit(true);
    try {
      const updated = await api.put(`/menu-items/${editing._id}`, {
        ...editForm,
        price: Number(editForm.price) || 0,
      });
      setItems((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
      push({ type: "success", message: "Menu item updated" });
      closeEdit();
    } catch (err) {
      push({ type: "error", message: err.message });
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) return <div className="state">Loading menu…</div>;

  return (
    <div>
      <div className="page-head">
        <div>
          <Link to="/restaurants" style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
            <MdArrowBack /> Back to restaurants
          </Link>
          <h1 style={{ marginTop: 4 }}>{restaurant?.name} — Menu</h1>
          <p>{items.length} items</p>
        </div>
      </div>

      {/* Add item form */}
      <form onSubmit={submit} className="card" style={{ marginBottom: 22 }}>
        <h3 style={{ fontSize: "0.95rem", marginBottom: 12 }}>
          <MdAdd /> Add menu item
        </h3>
        <div className="form-grid">
          <label className="field">
            <span>Name</span>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </label>
          <label className="field">
            <span>Category (e.g. Starters)</span>
            <input value={form.category} onChange={(e) => set("category", e.target.value)} required />
          </label>
          <label className="field">
            <span>Image</span>
            <ImagePicker
              value={form.image}
              onChange={(v) => set("image", v)}
              onError={(m) => push({ type: "error", message: m })}
            />
          </label>
          <label className="field">
            <span>Price (₹)</span>
            <input type="number" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} required />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            <span>Description</span>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} />
          </label>
          <label className="field">
            <span style={{ marginBottom: 4 }}>Veg</span>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={form.isVeg} onChange={(e) => set("isVeg", e.target.checked)} />
              Vegetarian
            </label>
          </label>
          <label className="field">
            <span style={{ marginBottom: 4 }}>Availability</span>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={form.available} onChange={(e) => set("available", e.target.checked)} />
              Available now
            </label>
          </label>
        </div>
        <div className="modal-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Adding…" : "Add item"}
          </button>
        </div>
      </form>

      {items.length === 0 ? (
        <div className="state">No menu items yet — add the first one above.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Price</th>
                <th>Veg</th>
                <th>Available</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it._id}>
                  <td>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <img
                        src={it.image}
                        alt={it.name}
                        style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }}
                      />
                      <strong>{it.name}</strong>
                    </div>
                  </td>
                  <td>{it.category}</td>
                  <td>₹{it.price}</td>
                  <td>
                    <span className={`badge ${it.isVeg ? "badge-success" : "badge-error"}`}>
                      {it.isVeg ? "Veg" : "Non-veg"}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${it.available ? "badge-success" : "badge-warning"}`}>
                      {it.available ? "Yes" : "Off"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 8 }}>
                      <button onClick={() => startEdit(it)} className="btn btn-secondary btn-sm">
                        <MdEdit /> Edit
                      </button>
                      <button onClick={() => remove(it)} className="btn btn-danger btn-sm">
                        <MdDelete /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && editForm && (
        <div className="modal-backdrop" onClick={closeEdit}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>Edit menu item</h3>
              <button className="btn btn-secondary btn-sm" onClick={closeEdit} aria-label="Close">
                <MdClose />
              </button>
            </div>
            <form onSubmit={saveEdit} style={{ marginTop: 14 }}>
              <div className="form-grid">
                <label className="field">
                  <span>Name</span>
                  <input value={editForm.name} onChange={(e) => setEdit("name", e.target.value)} required />
                </label>
                <label className="field">
                  <span>Category (e.g. Starters)</span>
                  <input value={editForm.category} onChange={(e) => setEdit("category", e.target.value)} required />
                </label>
                <label className="field">
                  <span>Image</span>
                  <ImagePicker
                    value={editForm.image}
                    onChange={(v) => setEdit("image", v)}
                    onError={(m) => push({ type: "error", message: m })}
                  />
                </label>
                <label className="field">
                  <span>Price (₹)</span>
                  <input type="number" min="0" value={editForm.price} onChange={(e) => setEdit("price", e.target.value)} required />
                </label>
                <label className="field" style={{ gridColumn: "1 / -1" }}>
                  <span>Description</span>
                  <textarea value={editForm.description} onChange={(e) => setEdit("description", e.target.value)} rows={2} />
                </label>
                <label className="field">
                  <span style={{ marginBottom: 4 }}>Veg</span>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <input type="checkbox" checked={editForm.isVeg} onChange={(e) => setEdit("isVeg", e.target.checked)} />
                    Vegetarian
                  </label>
                </label>
                <label className="field">
                  <span style={{ marginBottom: 4 }}>Availability</span>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={editForm.available}
                      onChange={(e) => setEdit("available", e.target.checked)}
                    />
                    Available now
                  </label>
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeEdit} disabled={savingEdit}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                  {savingEdit ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantMenu;

import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MdAdd, MdEdit, MdDelete, MdClose } from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import { NotificationContext } from "../../context/NotificationContext";
import { api, R } from "../../lib/api";
import ImagePicker from "../../components/ImagePicker/ImagePicker";
import Pagination from "../../components/Pagination/Pagination";

const emptyDraft = {
  name: "",
  price: "",
  image: "",
  description: "",
  isVeg: true,
  categoryId: "",
};

// Normalized editable fields — used both to submit and to detect "no change".
const normalize = (f) => ({
  categoryId: String(f.categoryId || ""),
  name: (f.name || "").trim(),
  price: Number(f.price),
  image: f.image || "",
  description: f.description || "",
  isVeg: !!f.isVeg,
});

const toForm = (it) => ({
  categoryId: String(it.categoryId || ""),
  name: it.name || "",
  price: String(it.price ?? ""),
  image: it.image || "",
  description: it.description || "",
  isVeg: it.isVeg !== false,
});

const Menu = () => {
  const { restaurant } = useContext(AuthContext);
  const { push } = useContext(NotificationContext);
  const restaurantId = restaurant?._id;

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]); // flat list across all categories
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);

  // Edit modal state
  const [editing, setEditing] = useState(null); // original item
  const [form, setForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const catName = useCallback(
    (id) => categories.find((c) => String(c._id) === String(id))?.name || "—",
    [categories]
  );

  const load = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const cats = await api.get(`${R}/${restaurantId}/categories`);
      setCategories(cats);
      // No restaurant-wide item endpoint — fetch per category and flatten.
      const lists = await Promise.all(
        cats.map((c) =>
          api
            .get(`${R}/categories/${c._id}/menu`)
            .then((rows) => rows.map((it) => ({ ...it, categoryName: c.name })))
        )
      );
      setItems(lists.flat());
    } catch (err) {
      push({ type: "error", message: err.message || "Could not load menu" });
    } finally {
      setLoading(false);
    }
  }, [restaurantId, push]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [restaurantId]);

  const setField = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const addItem = async (e) => {
    e.preventDefault();
    if (!draft.categoryId) {
      push({ type: "error", message: "Please choose a category" });
      return;
    }
    if (!draft.name.trim() || draft.price === "" || !draft.image.trim()) {
      push({ type: "error", message: "Name, price and image are required" });
      return;
    }
    setSaving(true);
    try {
      const item = await api.post(`${R}/categories/${draft.categoryId}/menu`, {
        name: draft.name,
        price: Number(draft.price),
        image: draft.image,
        description: draft.description,
        isVeg: draft.isVeg,
      });
      setItems((prev) => [...prev, { ...item, categoryName: catName(draft.categoryId) }]);
      setDraft({ ...emptyDraft, categoryId: draft.categoryId });
      push({ type: "success", message: "Item added" });
    } catch (err) {
      push({ type: "error", message: err.message || "Could not add item" });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (it) => {
    setEditing(it);
    setForm(toForm(it));
  };
  const closeEdit = () => {
    setEditing(null);
    setForm(null);
  };
  const setEditField = (patch) => setForm((f) => ({ ...f, ...patch }));

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!form.categoryId || !form.name.trim() || form.price === "" || !form.image.trim()) {
      push({ type: "error", message: "Category, name, price and image are required" });
      return;
    }
    const next = normalize(form);
    // Skip the update API entirely if nothing changed — just close.
    if (JSON.stringify(next) === JSON.stringify(normalize(toForm(editing)))) {
      push({ type: "info", message: "No changes" });
      closeEdit();
      return;
    }
    setSavingEdit(true);
    try {
      const updated = await api.put(`${R}/menu-items/${editing._id}`, next);
      setItems((prev) =>
        prev.map((it) =>
          it._id === updated._id ? { ...updated, categoryName: catName(updated.categoryId) } : it
        )
      );
      push({ type: "success", message: "Item updated" });
      closeEdit();
    } catch (err) {
      push({ type: "error", message: err.message || "Could not update item" });
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await api.del(`${R}/menu-items/${id}`);
      setItems((prev) => prev.filter((it) => it._id !== id));
      push({ type: "success", message: "Item deleted" });
    } catch (err) {
      push({ type: "error", message: err.message || "Could not delete item" });
    }
  };

  if (loading) return <div className="state">Loading menu…</div>;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Menu</h1>
          <p>All dishes on your menu.</p>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="state">
          You need a category before adding items.{" "}
          <Link to="/categories" className="btn btn-primary btn-sm" style={{ marginLeft: 8 }}>
            Add a category
          </Link>
        </div>
      ) : (
        <>
          {/* Add item — with a category dropdown */}
          <form onSubmit={addItem} className="card" style={{ marginBottom: 22 }}>
            <div className="form-grid">
              <label className="field">
                <span>Category *</span>
                <select value={draft.categoryId} onChange={(e) => setField({ categoryId: e.target.value })}>
                  <option value="">Select a category…</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Item name *</span>
                <input
                  value={draft.name}
                  onChange={(e) => setField({ name: e.target.value })}
                  placeholder="Paneer Tikka"
                />
              </label>
              <label className="field">
                <span>Price (₹) *</span>
                <input
                  type="number"
                  min="0"
                  value={draft.price}
                  onChange={(e) => setField({ price: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Image *</span>
                <ImagePicker
                  value={draft.image}
                  onChange={(v) => setField({ image: v })}
                  onError={(m) => push({ type: "error", message: m })}
                />
              </label>
              <label className="field" style={{ gridColumn: "1 / -1" }}>
                <span>Description</span>
                <input
                  value={draft.description}
                  onChange={(e) => setField({ description: e.target.value })}
                  placeholder="Optional"
                />
              </label>
            </div>
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 14 }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.88rem" }}>
                <input
                  type="checkbox"
                  checked={draft.isVeg}
                  onChange={(e) => setField({ isVeg: e.target.checked })}
                />
                Veg
              </label>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <MdAdd /> {saving ? "Adding…" : "Add item"}
              </button>
            </div>
          </form>

          {items.length === 0 ? (
            <div className="state">No menu items yet. Add your first dish above.</div>
          ) : (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Veg</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.slice((page - 1) * 10, page * 10).map((it) => (
                      <tr key={it._id}>
                        <td>{it.name}</td>
                        <td>{it.categoryName}</td>
                        <td>₹{it.price}</td>
                        <td>
                          <span className={`badge ${it.isVeg ? "badge-success" : "badge-error"}`}>
                            {it.isVeg ? "Veg" : "Non-veg"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: 8 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => startEdit(it)}>
                              <MdEdit /> Edit
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteItem(it._id)}>
                              <MdDelete /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                pagination={{
                  page,
                  totalPages: Math.max(1, Math.ceil(items.length / 10)),
                  total: items.length,
                  hasPrevPage: page > 1,
                  hasNextPage: page * 10 < items.length,
                }}
                onPageChange={setPage}
              />
            </>
          )}
        </>
      )}

      {/* Edit item modal */}
      {editing && form && (
        <div className="modal-backdrop" onClick={closeEdit}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>Edit item</h3>
              <button className="btn btn-secondary btn-sm" onClick={closeEdit} aria-label="Close">
                <MdClose />
              </button>
            </div>
            <form onSubmit={saveEdit} style={{ marginTop: 14 }}>
              <div className="form-grid">
                <label className="field">
                  <span>Category *</span>
                  <select value={form.categoryId} onChange={(e) => setEditField({ categoryId: e.target.value })}>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Item name *</span>
                  <input value={form.name} onChange={(e) => setEditField({ name: e.target.value })} />
                </label>
                <label className="field">
                  <span>Price (₹) *</span>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => setEditField({ price: e.target.value })}
                  />
                </label>
                <label className="field">
                  <span>Image *</span>
                  <ImagePicker
                    value={form.image}
                    onChange={(v) => setEditField({ image: v })}
                    onError={(m) => push({ type: "error", message: m })}
                  />
                </label>
                <label className="field" style={{ gridColumn: "1 / -1" }}>
                  <span>Description</span>
                  <input
                    value={form.description}
                    onChange={(e) => setEditField({ description: e.target.value })}
                  />
                </label>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.88rem" }}>
                  <input
                    type="checkbox"
                    checked={form.isVeg}
                    onChange={(e) => setEditField({ isVeg: e.target.checked })}
                  />
                  Veg
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
    </>
  );
};

export default Menu;

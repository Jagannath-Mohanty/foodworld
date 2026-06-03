import React, { useCallback, useContext, useEffect, useState } from "react";
import { MdAdd, MdDelete, MdEdit, MdClose } from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import { NotificationContext } from "../../context/NotificationContext";
import { api, R } from "../../lib/api";
import Pagination from "../../components/Pagination/Pagination";

// Editable fields only — used to detect whether anything actually changed.
const editable = (c) => ({
  name: c.name || "",
  description: c.description || "",
  isActive: c.isActive !== false,
});

const Categories = () => {
  const { restaurant } = useContext(AuthContext);
  const { push } = useContext(NotificationContext);
  const restaurantId = restaurant?._id;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCat, setNewCat] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);

  // Edit modal state
  const [editing, setEditing] = useState(null); // the original category
  const [form, setForm] = useState(null); // editable copy
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const cats = await api.get(`${R}/${restaurantId}/categories`);
      setCategories(cats);
    } catch (err) {
      push({ type: "error", message: err.message || "Could not load categories" });
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

  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCat.name.trim()) return;
    setSaving(true);
    try {
      const cat = await api.post(`${R}/${restaurantId}/categories`, newCat);
      setCategories((prev) => [...prev, cat]);
      setNewCat({ name: "", description: "" });
      push({ type: "success", message: "Category added" });
    } catch (err) {
      push({ type: "error", message: err.message || "Could not add category" });
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (catId) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await api.del(`${R}/categories/${catId}`);
      setCategories((prev) => prev.filter((c) => c._id !== catId));
      push({ type: "success", message: "Category deleted" });
    } catch (err) {
      push({ type: "error", message: err.message || "Could not delete category" });
    }
  };

  const startEdit = (cat) => {
    setEditing(cat);
    setForm(editable(cat));
  };

  const closeEdit = () => {
    setEditing(null);
    setForm(null);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      push({ type: "error", message: "Name is required" });
      return;
    }
    // Only call the update API if something actually changed.
    if (JSON.stringify(form) === JSON.stringify(editable(editing))) {
      push({ type: "info", message: "No changes" });
      closeEdit();
      return;
    }
    setSavingEdit(true);
    try {
      const updated = await api.put(`${R}/categories/${editing._id}`, form);
      setCategories((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
      push({ type: "success", message: "Category updated" });
      closeEdit();
    } catch (err) {
      push({ type: "error", message: err.message || "Could not update category" });
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Categories</h1>
          <p>Menu sections for {restaurant?.name || "your restaurant"}.</p>
        </div>
      </div>

      {/* Add category */}
      <form onSubmit={addCategory} className="card" style={{ marginBottom: 22 }}>
        <div className="field-row" style={{ alignItems: "end" }}>
          <label className="field">
            <span>New category name *</span>
            <input
              value={newCat.name}
              onChange={(e) => setNewCat((c) => ({ ...c, name: e.target.value }))}
              placeholder="Starters"
            />
          </label>
          <label className="field">
            <span>Description (optional)</span>
            <input
              value={newCat.description}
              onChange={(e) => setNewCat((c) => ({ ...c, description: e.target.value }))}
              placeholder="Begin your meal"
            />
          </label>
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <MdAdd /> {saving ? "Adding…" : "Add category"}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="state">Loading categories…</div>
      ) : categories.length === 0 ? (
        <div className="state">No categories yet. Add one above to start building your menu.</div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.slice((page - 1) * 10, page * 10).map((cat) => (
                  <tr key={cat._id}>
                    <td>{cat.name}</td>
                    <td>{cat.description || "—"}</td>
                    <td>
                      <span className={`badge ${cat.isActive ? "badge-success" : "badge-warning"}`}>
                        {cat.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => startEdit(cat)}>
                          <MdEdit /> Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteCategory(cat._id)}>
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
              totalPages: Math.max(1, Math.ceil(categories.length / 10)),
              total: categories.length,
              hasPrevPage: page > 1,
              hasNextPage: page * 10 < categories.length,
            }}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Edit modal */}
      {editing && form && (
        <div className="modal-backdrop" onClick={closeEdit}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>Edit category</h3>
              <button className="btn btn-secondary btn-sm" onClick={closeEdit} aria-label="Close">
                <MdClose />
              </button>
            </div>
            <form onSubmit={saveEdit} style={{ marginTop: 14 }}>
              <label className="field" style={{ marginBottom: 12 }}>
                <span>Name *</span>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </label>
              <label className="field" style={{ marginBottom: 12 }}>
                <span>Description</span>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "0.88rem" }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                Active (visible to customers)
              </label>
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

export default Categories;

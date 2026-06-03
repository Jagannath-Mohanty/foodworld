import React, { useCallback, useContext, useEffect, useState } from "react";
import { MdAdd, MdClose } from "react-icons/md";
import { api } from "../../lib/api";
import { NotificationContext } from "../../context/NotificationContext";
import Pagination from "../../components/Pagination/Pagination";

const blank = {
  code: "",
  description: "",
  type: "flat",
  value: "",
  minOrderAmount: 0,
  maxDiscount: "",
  expiresAt: "",
  usageLimit: "",
  perUserLimit: 1,
  isActive: true,
};

const Coupons = () => {
  const { push } = useContext(NotificationContext);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/coupons?page=${page}&limit=10`);
      setCoupons(data.items || []);
      setPagination(data.pagination || null);
    } catch (err) {
      push({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }, [page, push]);

  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/coupons", {
        code: form.code.toUpperCase().trim(),
        description: form.description,
        type: form.type,
        value: Number(form.value) || 0,
        minOrderAmount: Number(form.minOrderAmount) || 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        perUserLimit: Number(form.perUserLimit) || 1,
        isActive: !!form.isActive,
      });
      push({ type: "success", message: `Coupon ${form.code.toUpperCase()} created` });
      setOpen(false);
      setForm(blank);
      load();
    } catch (err) {
      push({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Coupons</h1>
          <p>Promotional discount codes — flat or percent off.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <MdAdd /> New coupon
        </button>
      </div>

      {loading ? (
        <div className="state">Loading coupons…</div>
      ) : coupons.length === 0 ? (
        <div className="state">No coupons yet — click "New coupon" to add one.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Min order</th>
                <th>Expires</th>
                <th>Usage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c._id}>
                  <td><strong>{c.code}</strong>
                    {c.description && (
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {c.description}
                      </div>
                    )}
                  </td>
                  <td>{c.type}</td>
                  <td>
                    {c.type === "flat" ? `₹${c.value}` : `${c.value}%`}
                    {c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ""}
                  </td>
                  <td>₹{c.minOrderAmount}</td>
                  <td style={{ fontSize: "0.8rem" }}>
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    {c.usedCount || 0}
                    {c.usageLimit != null ? ` / ${c.usageLimit}` : ""}
                  </td>
                  <td>
                    <span className={`badge ${c.isActive ? "badge-success" : "badge-warning"}`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />

      {open && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>New coupon</h3>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: "1.1rem" }}
              >
                <MdClose />
              </button>
            </div>
            <form onSubmit={submit}>
              <div className="form-grid">
                <label className="field">
                  <span>Code</span>
                  <input
                    value={form.code}
                    onChange={(e) => set("code", e.target.value.toUpperCase())}
                    required
                    placeholder="WELCOME50"
                  />
                </label>
                <label className="field">
                  <span>Type</span>
                  <select value={form.type} onChange={(e) => set("type", e.target.value)}>
                    <option value="flat">Flat (₹ off)</option>
                    <option value="percent">Percent (% off)</option>
                  </select>
                </label>
                <label className="field">
                  <span>Value</span>
                  <input type="number" min="0" value={form.value} onChange={(e) => set("value", e.target.value)} required />
                </label>
                <label className="field">
                  <span>Max discount (₹, percent only)</span>
                  <input type="number" min="0" value={form.maxDiscount} onChange={(e) => set("maxDiscount", e.target.value)} />
                </label>
                <label className="field">
                  <span>Min order (₹)</span>
                  <input type="number" min="0" value={form.minOrderAmount} onChange={(e) => set("minOrderAmount", e.target.value)} />
                </label>
                <label className="field">
                  <span>Expires at</span>
                  <input type="datetime-local" value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} required />
                </label>
                <label className="field">
                  <span>Total usage limit (optional)</span>
                  <input type="number" min="0" value={form.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} />
                </label>
                <label className="field">
                  <span>Per-user limit</span>
                  <input type="number" min="1" value={form.perUserLimit} onChange={(e) => set("perUserLimit", e.target.value)} />
                </label>
                <label className="field" style={{ gridColumn: "1 / -1" }}>
                  <span>Description</span>
                  <input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Get ₹50 off on orders above ₹300" />
                </label>
                <label className="field" style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
                    Active immediately
                  </label>
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Creating…" : "Create coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons;

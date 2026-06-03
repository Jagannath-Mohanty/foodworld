import React, { useCallback, useContext, useEffect, useState } from "react";
import { MdRefresh, MdDeliveryDining, MdAdd, MdDelete, MdClose } from "react-icons/md";
import { api } from "../../lib/api";
import { NotificationContext } from "../../context/NotificationContext";
import Pagination from "../../components/Pagination/Pagination";

const emptyForm = {
  name: "",
  phone: "",
  age: "",
  bloodGroup: "",
  address: "",
  vehicleNumber: "",
  vehicleName: "",
  drivingLicenceNumber: "",
};

const DeliveryAgents = () => {
  const { push } = useContext(NotificationContext);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/admin/delivery-men?page=${page}&limit=12`);
      setAgents(data.items || []);
      setPagination(data.pagination || null);
    } catch (err) {
      push({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }, [page, push]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, []);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const addDeliveryMan = async (e) => {
    e.preventDefault();
    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.vehicleNumber.trim() ||
      !form.drivingLicenceNumber.trim()
    ) {
      push({ type: "error", message: "Name, phone, vehicle number and licence are required" });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, age: form.age === "" ? undefined : Number(form.age) };
      const man = await api.post("/admin/delivery-men", payload);
      setAgents((prev) => [man, ...prev]);
      setForm(emptyForm);
      setShowModal(false);
      push({ type: "success", message: "Delivery man added" });
    } catch (err) {
      push({ type: "error", message: err.message || "Could not add delivery man" });
    } finally {
      setSaving(false);
    }
  };

  const removeDeliveryMan = async (id) => {
    try {
      await api.del(`/admin/delivery-men/${id}`);
      setAgents((prev) => prev.filter((a) => a._id !== id));
      push({ type: "success", message: "Delivery man removed" });
    } catch (err) {
      push({ type: "error", message: err.message || "Could not remove" });
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Delivery agents</h1>
          <p>{agents.length} delivery {agents.length === 1 ? "man" : "men"} registered</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary" onClick={load}>
            <MdRefresh /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <MdAdd /> Add delivery man
          </button>
        </div>
      </div>

      {loading ? (
        <div className="state">Loading delivery men…</div>
      ) : agents.length === 0 ? (
        <div className="state">
          No delivery men yet. Use “Add delivery man” to register one.
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 18,
            }}
          >
            {agents.map((a) => (
              <article key={a._id} className="card">
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))",
                    color: "var(--color-text-inverse)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.3rem",
                  }}
                >
                  <MdDeliveryDining />
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: "1rem" }}>{a.name}</strong>
                  <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                    {a.vehicleName ? `${a.vehicleName} · ` : ""}{a.vehicleNumber}
                  </div>
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  title="Remove"
                  onClick={() => removeDeliveryMan(a._id)}
                >
                  <MdDelete />
                </button>
              </div>

              <div
                style={{
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: "1px dashed var(--color-border)",
                  fontSize: "0.82rem",
                  display: "grid",
                  gap: 6,
                }}
              >
                <Row label="Phone">{a.phone}</Row>
                <Row label="Licence">{a.drivingLicenceNumber}</Row>
                {a.bloodGroup ? <Row label="Blood group">{a.bloodGroup}</Row> : null}
                {a.age ? <Row label="Age">{a.age}</Row> : null}
                {a.address ? <Row label="Address">{a.address}</Row> : null}
              </div>

              <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginTop: 10 }}>
                Joined {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "—"}
              </div>
            </article>
            ))}
          </div>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>Add delivery man</h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                <MdClose />
              </button>
            </div>

            <form onSubmit={addDeliveryMan} style={{ marginTop: 14 }}>
              <div className="form-grid">
                <label className="field">
                  <span>Name *</span>
                  <input value={form.name} onChange={setField("name")} placeholder="Ravi Kumar" />
                </label>
                <label className="field">
                  <span>Phone * (login)</span>
                  <input value={form.phone} onChange={setField("phone")} placeholder="9876543210" />
                </label>
                <label className="field">
                  <span>Vehicle number *</span>
                  <input value={form.vehicleNumber} onChange={setField("vehicleNumber")} placeholder="KA01AB1234" />
                </label>
                <label className="field">
                  <span>Vehicle name</span>
                  <input value={form.vehicleName} onChange={setField("vehicleName")} placeholder="Honda Activa" />
                </label>
                <label className="field" style={{ gridColumn: "1 / -1" }}>
                  <span>Driving licence number *</span>
                  <input
                    value={form.drivingLicenceNumber}
                    onChange={setField("drivingLicenceNumber")}
                    placeholder="DL-1420110012345"
                  />
                </label>
                <label className="field">
                  <span>Age</span>
                  <input type="number" min="0" value={form.age} onChange={setField("age")} />
                </label>
                <label className="field">
                  <span>Blood group</span>
                  <input value={form.bloodGroup} onChange={setField("bloodGroup")} placeholder="O+" />
                </label>
                <label className="field" style={{ gridColumn: "1 / -1" }}>
                  <span>Address</span>
                  <input value={form.address} onChange={setField("address")} placeholder="Street, city" />
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving…" : "Add delivery man"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Row = ({ label, children }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
    <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
    <span style={{ textAlign: "right" }}>{children}</span>
  </div>
);

export default DeliveryAgents;

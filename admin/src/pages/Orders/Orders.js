import React, { useCallback, useContext, useEffect, useState } from "react";
import { MdRefresh } from "react-icons/md";
import { api } from "../../lib/api";
import { useAnyOrderUpdate } from "../../lib/socket";
import { NotificationContext } from "../../context/NotificationContext";
import Pagination from "../../components/Pagination/Pagination";

const STATUS_FLOW = {
  placed: "accepted",
  accepted: "preparing",
  preparing: "ready_for_pickup",
  ready_for_pickup: null, // waiting on delivery agent
  out_for_delivery: null, // delivery agent owns this
  delivered: null,
  cancelled: null,
};

const STATUS_LABEL = {
  placed: "Placed",
  accepted: "Accepted",
  preparing: "Preparing",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_BADGE = {
  placed: "badge-info",
  accepted: "badge-info",
  preparing: "badge-warning",
  ready_for_pickup: "badge-warning",
  out_for_delivery: "badge-primary",
  delivered: "badge-success",
  cancelled: "badge-error",
};

const Orders = () => {
  const { push } = useContext(NotificationContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const update = useAnyOrderUpdate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/admin/orders?page=${page}&limit=10`);
      setOrders(data.items || []);
      setPagination(data.pagination || null);
    } catch (err) {
      push({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }, [page, push]);

  useEffect(() => { load(); }, [load]);

  /* Live: merge incoming socket updates into the current rows */
  useEffect(() => {
    if (!update) return;
      setOrders((prev) =>
        prev.map((o) =>
          String(o._id) === String(update.orderId) ? { ...o, ...update } : o
        )
      );
    }, [update]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const advance = async (order) => {
    const next = STATUS_FLOW[order.status];
    if (!next) return;
    try {
      await api.put(`/admin/orders/${order._id}/status`, { status: next });
      push({ type: "success", message: `Moved to ${STATUS_LABEL[next]}` });
    } catch (err) {
      push({ type: "error", message: err.message });
    }
  };

  const cancel = async (order) => {
    if (!window.confirm(`Cancel order #${order._id.slice(-6)}?`)) return;
    try {
      await api.put(`/admin/orders/${order._id}/status`, {
        status: "cancelled",
        note: "Cancelled by admin",
      });
      push({ type: "success", message: "Order cancelled" });
    } catch (err) {
      push({ type: "error", message: err.message });
    }
  };

  const filtered = orders.filter((o) => filter === "all" || o.status === filter);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Orders</h1>
          <p>Live order board — advance state, cancel, or watch deliveries.</p>
        </div>
        <button className="btn btn-secondary" onClick={load}>
          <MdRefresh /> Refresh
        </button>
      </div>

      <div className="toolbar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All statuses ({orders.length})</option>
          {Object.keys(STATUS_LABEL).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]} ({orders.filter((o) => o.status === s).length})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="state">Loading orders…</div>
      ) : filtered.length === 0 ? (
        <div className="state">No orders match this filter.</div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Restaurant</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Time</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const next = STATUS_FLOW[o.status];
                return (
                  <tr key={o._id}>
                    <td><code>{o._id.slice(-6).toUpperCase()}</code></td>
                    <td>
                      {o.userId?.name || "—"}
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {o.userId?.email}
                      </div>
                    </td>
                    <td>{o.restaurantId?.name || "—"}</td>
                    <td>{o.items?.length}</td>
                    <td>₹{o.totalAmount}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[o.status]}`}>
                        {STATUS_LABEL[o.status]}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                      {new Date(o.createdAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {next && (
                        <button onClick={() => advance(o)} className="btn btn-primary btn-sm">
                          → {STATUS_LABEL[next]}
                        </button>
                      )}{" "}
                      {!["delivered", "cancelled"].includes(o.status) && (
                        <button onClick={() => cancel(o)} className="btn btn-danger btn-sm">
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

export default Orders;

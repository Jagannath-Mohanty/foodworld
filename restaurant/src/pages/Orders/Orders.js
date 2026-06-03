import React, { useCallback, useContext, useEffect, useState } from "react";
import { MdRefresh } from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import { NotificationContext } from "../../context/NotificationContext";
import { getSocket } from "../../lib/socket";
import { api, R } from "../../lib/api";
import Pagination from "../../components/Pagination/Pagination";

// What the partner can do next from each status.
const NEXT_ACTIONS = {
  placed: [
    { label: "Accept", status: "accepted", cls: "btn-primary" },
    { label: "Reject", status: "cancelled", cls: "btn-danger" },
  ],
  accepted: [{ label: "Start preparing", status: "preparing", cls: "btn-primary" }],
  preparing: [{ label: "Mark ready", status: "ready_for_pickup", cls: "btn-primary" }],
};

const STATUS_BADGE = {
  placed: "badge-warning",
  accepted: "badge-info",
  preparing: "badge-info",
  ready_for_pickup: "badge-primary",
  out_for_delivery: "badge-primary",
  delivered: "badge-success",
  cancelled: "badge-error",
};

const Orders = () => {
  const { restaurant } = useContext(AuthContext);
  const { push } = useContext(NotificationContext);
  const restaurantId = restaurant?._id;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const data = await api.get(`${R}/${restaurantId}/orders`);
      setOrders(data);
    } catch (err) {
      push({ type: "error", message: err.message || "Could not load orders" });
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

  // Refresh the list the moment a new order arrives.
  useEffect(() => {
    if (!restaurantId) return;
    const socket = getSocket();
    socket.emit("restaurant:subscribe", restaurantId);
    const onNew = () => load();
    socket.on("order:new", onNew);
    return () => socket.off("order:new", onNew);
  }, [restaurantId, load]);

  const updateStatus = async (orderId, status) => {
    setBusyId(orderId);
    try {
      const data = await api.patch(`${R}/orders/${orderId}/status`, { status });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: data.status } : o))
      );
      push({ type: "success", message: `Order ${status.replace(/_/g, " ")}` });
    } catch (err) {
      push({ type: "error", message: err.message || "Could not update order" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Orders</h1>
          <p>Incoming orders for {restaurant?.name || "your restaurant"}.</p>
        </div>
        <button className="btn btn-secondary" onClick={load}>
          <MdRefresh /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="state">Loading orders…</div>
      ) : orders.length === 0 ? (
        <div className="state">No orders yet. New orders will appear here in real time.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {orders.slice((page - 1) * 8, page * 8).map((o) => (
            <div key={o._id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <strong style={{ fontSize: "0.95rem" }}>
                    #{String(o._id).slice(-6).toUpperCase()}
                  </strong>
                  <div style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginTop: 2 }}>
                    {o.customerId?.name || "Customer"}
                    {o.customerId?.phone ? ` · ${o.customerId.phone}` : ""}
                    {o.createdAt ? ` · ${new Date(o.createdAt).toLocaleString()}` : ""}
                  </div>
                </div>
                <span className={`badge ${STATUS_BADGE[o.status] || ""}`}>
                  {o.status.replace(/_/g, " ")}
                </span>
              </div>

              <div style={{ margin: "12px 0", fontSize: "0.88rem" }}>
                {(o.items || []).map((it, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                    <span>{it.quantity} × {it.name}</span>
                    <span style={{ color: "var(--color-text-muted)" }}>₹{it.price * it.quantity}</span>
                  </div>
                ))}
              </div>

              {o.deliveryAddress?.line1 && (
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: 10 }}>
                  Deliver to: {o.deliveryAddress.line1}, {o.deliveryAddress.city}
                </div>
              )}

              <div
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  borderTop: "1px solid var(--color-border)", paddingTop: 12,
                }}
              >
                <strong>Total: ₹{o.totalAmount}</strong>
                <div style={{ display: "flex", gap: 8 }}>
                  {(NEXT_ACTIONS[o.status] || []).map((a) => (
                    <button
                      key={a.status}
                      className={`btn btn-sm ${a.cls}`}
                      disabled={busyId === o._id}
                      onClick={() => updateStatus(o._id, a.status)}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination
        pagination={{
          page,
          totalPages: Math.max(1, Math.ceil(orders.length / 8)),
          total: orders.length,
          hasPrevPage: page > 1,
          hasNextPage: page * 8 < orders.length,
        }}
        onPageChange={setPage}
      />
    </>
  );
};

export default Orders;

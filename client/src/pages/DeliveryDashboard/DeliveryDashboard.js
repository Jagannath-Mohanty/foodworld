import React, { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdAccessTime, MdLocationOn, MdRestaurant, MdCheckCircle } from "react-icons/md";
import { NotificationContext } from "../../context/NotificationContext";
import "./DeliveryDashboard.css";

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const { push } = useContext(NotificationContext);
  const [available, setAvailable] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("available"); // 'available' | 'mine'

  const token = localStorage.getItem("token");

  const authedFetch = useCallback(
    (path, init = {}) =>
      fetch(`/api${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token?.replace(/"/g, "")}`,
          ...(init.headers || {}),
        },
      }),
    [token]
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [aRes, mRes] = await Promise.all([
        authedFetch("/delivery/orders/available"),
        authedFetch("/delivery/orders/mine"),
      ]);
      if (aRes.status === 401 || aRes.status === 403) {
        navigate("/login");
        return;
      }
      const aData = aRes.ok ? await aRes.json() : [];
      const mData = mRes.ok ? await mRes.json() : [];
      setAvailable(aData);
      setMine(mData);
    } catch (err) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [authedFetch, navigate]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const acceptOrder = async (orderId) => {
    const res = await authedFetch(`/delivery/orders/${orderId}/accept`, {
      method: "POST",
    });
    if (res.ok) {
      push({ type: "success", message: "Order accepted — head to the restaurant" });
      loadAll();
      setTab("mine");
    } else {
      const err = await res.json().catch(() => ({}));
      push({ type: "error", message: err.error || "Could not accept order" });
    }
  };

  const deliverOrder = async (orderId) => {
    const res = await authedFetch(`/delivery/orders/${orderId}/deliver`, {
      method: "POST",
    });
    if (res.ok) {
      push({ type: "success", message: "Delivery completed" });
      loadAll();
    } else {
      const err = await res.json().catch(() => ({}));
      push({ type: "error", message: err.error || "Could not mark delivered" });
    }
  };

  const visibleOrders = tab === "available" ? available : mine;

  return (
    <div className="dd-page">
      <header className="dd-header">
        <h1>Delivery dashboard</h1>
        <p>Pick up orders, deliver them, mark complete.</p>
      </header>

      <div className="dd-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === "available"}
          className={`dd-tab ${tab === "available" ? "dd-tab-active" : ""}`}
          onClick={() => setTab("available")}
        >
          Available ({available.length})
        </button>
        <button
          role="tab"
          aria-selected={tab === "mine"}
          className={`dd-tab ${tab === "mine" ? "dd-tab-active" : ""}`}
          onClick={() => setTab("mine")}
        >
          My deliveries ({mine.length})
        </button>
        <button className="dd-refresh" onClick={loadAll} type="button">
          Refresh
        </button>
      </div>

      {error && <div className="dd-error">{error}</div>}

      {loading ? (
        <div className="dd-state">Loading orders…</div>
      ) : visibleOrders.length === 0 ? (
        <div className="dd-state">
          {tab === "available"
            ? "No orders are ready for pickup yet."
            : "You have no active deliveries."}
        </div>
      ) : (
        <div className="dd-list">
          {visibleOrders.map((order) => (
            <article key={order._id} className="dd-card">
              <div className="dd-card-head">
                <div>
                  <h3>
                    <MdRestaurant /> {order.restaurantId?.name || "Restaurant"}
                  </h3>
                  <p className="dd-meta">
                    <MdAccessTime />
                    {new Date(order.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" · ₹"}
                    {order.totalAmount}
                  </p>
                </div>
                <span className={`dd-badge dd-badge-${order.status}`}>
                  {order.status.replace(/_/g, " ")}
                </span>
              </div>

              {order.restaurantId?.address && (
                <p className="dd-address">
                  <MdLocationOn /> Pickup: {order.restaurantId.address.street},{" "}
                  {order.restaurantId.address.city}
                </p>
              )}
              {order.deliveryAddress?.line1 && (
                <p className="dd-address">
                  <MdLocationOn /> Drop: {order.deliveryAddress.line1}
                  {order.deliveryAddress.city ? `, ${order.deliveryAddress.city}` : ""}
                </p>
              )}

              <div className="dd-items">
                {order.items.slice(0, 3).map((it) => (
                  <span key={it._id} className="dd-item-chip">
                    {it.quantity}× {it.name}
                  </span>
                ))}
                {order.items.length > 3 && (
                  <span className="dd-item-chip dd-item-more">
                    +{order.items.length - 3} more
                  </span>
                )}
              </div>

              <div className="dd-card-actions">
                {tab === "available" ? (
                  <button
                    className="dd-btn dd-btn-primary"
                    onClick={() => acceptOrder(order._id)}
                  >
                    Accept & pick up
                  </button>
                ) : (
                  <button
                    className="dd-btn dd-btn-success"
                    onClick={() => deliverOrder(order._id)}
                  >
                    <MdCheckCircle /> Mark delivered
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;

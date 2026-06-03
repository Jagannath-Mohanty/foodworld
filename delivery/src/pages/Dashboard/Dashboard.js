import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { MdRefresh, MdLocationOn, MdStorefront } from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import { NotificationContext } from "../../context/NotificationContext";
import { getSocket } from "../../lib/socket";
import { api, R } from "../../lib/api";
import DeliveryMap from "../../components/DeliveryMap/DeliveryMap";
import Pagination from "../../components/Pagination/Pagination";

const Dashboard = () => {
  const { agent } = useContext(AuthContext);
  const { push } = useContext(NotificationContext);

  const [available, setAvailable] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [current, setCurrent] = useState(null); // {lat,lng}
  const lastPost = useRef(0);
  const [availablePage, setAvailablePage] = useState(1);
  const [minePage, setMinePage] = useState(1);
  const [availablePagination, setAvailablePagination] = useState(null);
  const [minePagination, setMinePagination] = useState(null);

  const load = useCallback(async () => {
      setLoading(true);
      try {
        const [a, m] = await Promise.all([
          api.get(`${R}/orders/available?page=${availablePage}&limit=10`),
          api.get(`${R}/orders/mine?page=${minePage}&limit=10`),
        ]);
      setAvailable(a.items || []);
      setMine(m.items || []);
      setAvailablePagination(a.pagination || null);
      setMinePagination(m.pagination || null);
      } catch (err) {
        push({ type: "error", message: err.message || "Could not load orders" });
      } finally {
        setLoading(false);
      }
  }, [availablePage, minePage, push]);

  useEffect(() => {
    load();
  }, [load]);

  // Live order feed: refresh when an order becomes available or is taken.
  useEffect(() => {
    const socket = getSocket();
    const refresh = () => load();
    socket.on("delivery:order-available", refresh);
    socket.on("delivery:order-taken", refresh);
    return () => {
      socket.off("delivery:order-available", refresh);
      socket.off("delivery:order-taken", refresh);
    };
  }, [load]);

  // Track the agent's live GPS; report to the server (throttled) for customer tracking.
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrent(loc);
        const now = Date.now();
        if (now - lastPost.current > 15000) {
          lastPost.current = now;
          api.post(`${R}/location`, loc).catch(() => {});
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const accept = async (id) => {
    setBusyId(id);
    try {
      await api.post(`${R}/orders/${id}/accept`);
      push({ type: "success", message: "Order accepted — head to the restaurant" });
      load();
    } catch (err) {
      push({ type: "error", message: err.message || "Could not accept" });
    } finally {
      setBusyId(null);
    }
  };

  const deliver = async (id) => {
    setBusyId(id);
    try {
      await api.post(`${R}/orders/${id}/deliver`);
      push({ type: "success", message: "Delivered!" });
      load();
    } catch (err) {
      push({ type: "error", message: err.message || "Could not mark delivered" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Deliveries</h1>
          <p>
            {agent?.isAvailable
              ? "You're online — new orders will ping you."
              : "Go online (top right) to receive orders."}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={load}>
          <MdRefresh /> Refresh
        </button>
      </div>

      {/* ===== My active delivery (with map) ===== */}
      {mine.map((o) => {
        const pickup = o.restaurantId?.location?.coordinates;
        const drop = o.deliveryAddress?.location?.coordinates;
        return (
          <div key={o._id} className="card" style={{ marginBottom: 18 }}>
            <div className="page-head" style={{ marginBottom: 12 }}>
              <div>
                <h1 style={{ fontSize: "1.1rem" }}>
                  Delivering #{String(o._id).slice(-6).toUpperCase()}
                </h1>
                <p>
                  <MdStorefront /> {o.restaurantId?.name} → {o.deliveryAddress?.line1},{" "}
                  {o.deliveryAddress?.city}
                </p>
              </div>
              <span className="badge badge-primary">out for delivery</span>
            </div>

            <DeliveryMap pickup={pickup} drop={drop} current={current} />

            <div
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginTop: 14,
              }}
            >
              <strong>₹{o.totalAmount}</strong>
              <button
                className="btn btn-primary"
                disabled={busyId === o._id}
                onClick={() => deliver(o._id)}
              >
                Mark delivered
              </button>
            </div>
          </div>
        );
      })}
      <Pagination pagination={minePagination} onPageChange={setMinePage} />

      {/* ===== Available orders ===== */}
      <h2 style={{ fontSize: "1.05rem", margin: "8px 0 12px" }}>Available pickups</h2>
      {loading ? (
        <div className="state">Loading…</div>
      ) : available.length === 0 ? (
        <div className="state">No orders ready for pickup right now.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {available.map((o) => (
            <div key={o._id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <strong>#{String(o._id).slice(-6).toUpperCase()}</strong>
                  <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginTop: 4 }}>
                    <MdStorefront /> {o.restaurantId?.name || "Restaurant"}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                    <MdLocationOn /> {o.deliveryAddress?.line1}, {o.deliveryAddress?.city}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong>₹{o.totalAmount}</strong>
                  <div>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: 8 }}
                      disabled={busyId === o._id}
                      onClick={() => accept(o._id)}
                    >
                      Accept
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination pagination={availablePagination} onPageChange={setAvailablePage} />
    </>
  );
};

export default Dashboard;

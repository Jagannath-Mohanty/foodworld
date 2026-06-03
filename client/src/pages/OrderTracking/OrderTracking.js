import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import { MdCheckCircle, MdAccessTime, MdPhone, MdLocationOn } from "react-icons/md";
import { useOrderUpdates } from "../../lib/socket";
import RatingForm from "../../components/RatingForm/RatingForm";
import "leaflet/dist/leaflet.css";
import "./OrderTracking.css";

/* Leaflet's default icon images break when bundled — point them at the CDN. */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const STATUS_ORDER = [
  "placed",
  "accepted",
  "preparing",
  "ready_for_pickup",
  "out_for_delivery",
  "delivered",
];

const STATUS_LABELS = {
  placed: "Order placed",
  accepted: "Restaurant accepted",
  preparing: "Preparing your food",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const OrderTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* Live updates over socket.io */
  const liveUpdate = useOrderUpdates(id);

  useEffect(() => {
    if (!liveUpdate) return;
    setOrder((prev) => (prev ? { ...prev, ...liveUpdate } : prev));
  }, [liveUpdate]);

  /* Initial load */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const cleaned = token.replace(/"/g, "");

    fetch(`/api/orders/${id}`, {
      headers: { Authorization: `Bearer ${cleaned}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
        return res.json();
      })
      .then(setOrder)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  /* ---------- map setup ---------- */

  const pickup = order?.restaurantId?.address?.location?.coordinates;
  const drop = order?.deliveryAddress?.location?.coordinates;

  const mapData = useMemo(() => {
    const pts = [];
    if (Array.isArray(pickup) && pickup.length === 2)
      pts.push({ pos: [pickup[1], pickup[0]], label: "Pickup", info: order?.restaurantId?.name });
    if (Array.isArray(drop) && drop.length === 2)
      pts.push({ pos: [drop[1], drop[0]], label: "Drop", info: order?.deliveryAddress?.line1 });
    if (pts.length === 0) return null;
    const center =
      pts.length === 2
        ? [(pts[0].pos[0] + pts[1].pos[0]) / 2, (pts[0].pos[1] + pts[1].pos[1]) / 2]
        : pts[0].pos;
    return { pts, center };
  }, [pickup, drop, order]);

  if (loading) return <div className="ot-state">Loading order…</div>;
  if (error || !order) return <div className="ot-state ot-state-error">{error || "Not found"}</div>;

  const statusIdx = STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="ot-page">
      <header className="ot-header">
        <h1>Order tracking</h1>
        <p className="ot-order-id">#{order._id.slice(-8).toUpperCase()}</p>
      </header>

      {/* ===== Status timeline ===== */}
      <section className="ot-timeline-card">
        <h2>Status</h2>
        {isCancelled ? (
          <div className="ot-cancelled">This order was cancelled.</div>
        ) : (
          <ol className="ot-timeline">
            {STATUS_ORDER.map((s, i) => {
              const done = i < statusIdx;
              const active = i === statusIdx;
              const event = order.timeline?.find((t) => t.status === s);
              return (
                <li
                  key={s}
                  className={`ot-step ${done ? "ot-step-done" : ""} ${
                    active ? "ot-step-active" : ""
                  }`}
                >
                  <span className="ot-step-bullet">
                    {done ? <MdCheckCircle /> : i + 1}
                  </span>
                  <div className="ot-step-text">
                    <p className="ot-step-label">{STATUS_LABELS[s]}</p>
                    {event && (
                      <p className="ot-step-time">
                        <MdAccessTime />
                        {new Date(event.at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* ===== Map ===== */}
      {mapData && (
        <section className="ot-map-card">
          <h2>Route</h2>
          <div className="ot-map">
            <MapContainer
              center={mapData.center}
              zoom={13}
              scrollWheelZoom={false}
              style={{ height: 320, width: "100%", borderRadius: 12 }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mapData.pts.map((p) => (
                <Marker key={p.label} position={p.pos}>
                  <Popup>
                    <strong>{p.label}</strong>
                    {p.info ? <> · {p.info}</> : null}
                  </Popup>
                </Marker>
              ))}
              {mapData.pts.length === 2 && (
                <Polyline positions={mapData.pts.map((p) => p.pos)} color="#ff593c" />
              )}
            </MapContainer>
          </div>
        </section>
      )}

      {/* ===== Summary ===== */}
      <section className="ot-summary-card">
        <h2>Order summary</h2>

        {order.restaurantId && (
          <p className="ot-summary-line">
            <MdLocationOn /> From <strong>{order.restaurantId.name}</strong>
          </p>
        )}
        {order.deliveryAgentId && (
          <p className="ot-summary-line">
            <MdPhone /> Delivery: <strong>{order.deliveryAgentId.name}</strong>
            {order.deliveryAgentId.phone ? ` · ${order.deliveryAgentId.phone}` : null}
          </p>
        )}

        <ul className="ot-items">
          {order.items.map((it) => (
            <li key={it._id}>
              <span>
                {it.quantity}× {it.name}
              </span>
              <span>₹{it.price * it.quantity}</span>
            </li>
          ))}
        </ul>

        <div className="ot-totals">
          <div>
            <span>Subtotal</span>
            <span>₹{order.totalAmount - (order.deliveryFee || 0)}</span>
          </div>
          <div>
            <span>Delivery fee</span>
            <span>₹{order.deliveryFee || 0}</span>
          </div>
          <div className="ot-total-row">
            <span>Total</span>
            <span>₹{order.totalAmount}</span>
          </div>
        </div>

        <div className="ot-payment">
          Payment:{" "}
          <span className={`ot-payment-status ot-payment-${order.paymentStatus}`}>
            {order.paymentStatus}
          </span>{" "}
          ({order.paymentMethod})
        </div>
      </section>

      {order.status === "delivered" && !order.ratedAt && (
        <RatingForm
          order={order}
          onSubmitted={() => setOrder((p) => ({ ...p, ratedAt: new Date().toISOString() }))}
        />
      )}

      {order.ratedAt && (
        <div className="ot-rated">Thanks for rating this order!</div>
      )}
    </div>
  );
};

export default OrderTracking;

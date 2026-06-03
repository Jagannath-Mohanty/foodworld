import React, { useContext, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { MdLogout } from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import { NotificationContext } from "../../context/NotificationContext";
import { getSocket } from "../../lib/socket";
import { api, R } from "../../lib/api";
import "./DeliveryLayout.css";

const DeliveryLayout = () => {
  const { agent, updateAgent, logout } = useContext(AuthContext);
  const { push } = useContext(NotificationContext);
  const navigate = useNavigate();
  const online = !!agent?.isAvailable;

  // Join/leave the delivery room to match the online state + toast on new orders.
  useEffect(() => {
    const socket = getSocket();
    if (online) socket.emit("delivery:subscribe");
    const onAvailable = (p) =>
      push({
        type: "success",
        message: `New pickup at ${p?.restaurantName || "a restaurant"} — ₹${p?.total ?? ""}`,
        duration: 6000,
      });
    socket.on("delivery:order-available", onAvailable);
    return () => socket.off("delivery:order-available", onAvailable);
  }, [online, push]);

  const toggleOnline = async () => {
    const next = !online;
    try {
      await api.post(`${R}/availability`, { isAvailable: next });
      updateAgent({ isAvailable: next });
      const socket = getSocket();
      socket.emit(next ? "delivery:subscribe" : "delivery:unsubscribe");
      push({ type: next ? "success" : "info", message: next ? "You are online" : "You are offline" });
    } catch (err) {
      push({ type: "error", message: err.message || "Could not update status" });
    }
  };

  const onLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="dl-shell">
      <header className="dl-topbar">
        <div className="dl-brand">
          <div className="dl-brand-logo">FW</div>
          <div>
            <p className="dl-brand-name">{agent?.name || "Delivery"}</p>
            <p className="dl-brand-sub">Delivery partner</p>
          </div>
        </div>

        <div className="dl-topbar-right">
          <button className={`dl-online-toggle ${online ? "on" : ""}`} onClick={toggleOnline}>
            <span className="dl-online-dot" />
            {online ? "Online" : "Offline"}
          </button>
          <button className="dl-signout" onClick={onLogout}>
            <MdLogout /> Sign out
          </button>
        </div>
      </header>

      <main className="dl-content">
        <Outlet />
      </main>
    </div>
  );
};

export default DeliveryLayout;

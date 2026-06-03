import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { MdRestaurantMenu, MdStorefront } from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import { NotificationContext } from "../../context/NotificationContext";
import { api, R } from "../../lib/api";

const Dashboard = () => {
  const { restaurant, updateRestaurant } = useContext(AuthContext);
  const { push } = useContext(NotificationContext);
  const [busy, setBusy] = useState(false);

  const isActive = !!restaurant?.isActive;

  const toggleActive = async () => {
    setBusy(true);
    try {
      const data = await api.put(`${R}/${restaurant._id}/active`, {
        isActive: !isActive,
      });
      updateRestaurant({ isActive: data.isActive });
      push({
        type: "success",
        message: data.isActive ? "You are now accepting orders" : "Listing paused",
      });
    } catch (err) {
      push({ type: "error", message: err.message || "Could not update status" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{restaurant?.name || "Dashboard"}</h1>
          <p>Manage your storefront and menu.</p>
        </div>
        <span className={`badge ${isActive ? "badge-success" : "badge-warning"}`}>
          {isActive ? "Live" : "Paused"}
        </span>
      </div>

      <div className="form-grid">
        <div className="card">
          <h3 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <MdStorefront /> Storefront
          </h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginBottom: 14 }}>
            {isActive
              ? "Your restaurant is visible to customers."
              : "Your restaurant is hidden from customers."}
          </p>
          <button
            className={`btn ${isActive ? "btn-secondary" : "btn-primary"}`}
            onClick={toggleActive}
            disabled={busy}
          >
            {busy ? "Updating…" : isActive ? "Pause orders" : "Go live"}
          </button>
        </div>

        <div className="card">
          <h3 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <MdRestaurantMenu /> Menu
          </h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginBottom: 14 }}>
            Add categories and dishes customers can order.
          </p>
          <Link to="/menu" className="btn btn-primary">
            Manage menu
          </Link>
        </div>
      </div>
    </>
  );
};

export default Dashboard;

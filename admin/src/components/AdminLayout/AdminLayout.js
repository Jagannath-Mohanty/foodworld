import React, { useContext } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  MdDashboard,
  MdRestaurant,
  MdReceiptLong,
  MdLocalOffer,
  MdPeople,
  MdDeliveryDining,
  MdLogout,
  MdNotificationsNone,
} from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import "./AdminLayout.css";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: <MdDashboard /> },
  { to: "/restaurants", label: "Restaurants", icon: <MdRestaurant /> },
  { to: "/orders", label: "Orders", icon: <MdReceiptLong /> },
  { to: "/coupons", label: "Coupons", icon: <MdLocalOffer /> },
  { to: "/users", label: "Users", icon: <MdPeople /> },
  { to: "/delivery-agents", label: "Delivery agents", icon: <MdDeliveryDining /> },
];

const AdminLayout = () => {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="al-shell">
      {/* ===== Sidebar ===== */}
      <aside className="al-sidebar">
        <div className="al-brand">
          <div className="al-brand-logo">FW</div>
          <div>
            <p className="al-brand-name">FoodWorld</p>
            <p className="al-brand-sub">Admin console</p>
          </div>
        </div>

        <nav className="al-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `al-nav-link ${isActive ? "al-nav-link-active" : ""}`
              }
            >
              <span className="al-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="al-logout" onClick={onLogout}>
          <MdLogout /> Sign out
        </button>
      </aside>

      {/* ===== Main content ===== */}
      <div className="al-main">
        <header className="al-topbar">
          <div />
          <div className="al-topbar-right">
            <button className="al-icon-btn" aria-label="Notifications">
              <MdNotificationsNone />
            </button>
            <div className="al-user-chip" title={user?._id || ""}>
              <span className="al-user-avatar">
                {(user?._id || "A").slice(-2).toUpperCase()}
              </span>
              <span className="al-user-label">Admin</span>
            </div>
          </div>
        </header>

        <main className="al-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

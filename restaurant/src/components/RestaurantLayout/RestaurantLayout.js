import React, { useContext, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  MdDashboard,
  MdCategory,
  MdRestaurantMenu,
  MdReceiptLong,
  MdStorefront,
  MdLogout,
  MdPerson,
  MdManageAccounts,
  MdExpandMore,
} from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import { NotificationContext } from "../../context/NotificationContext";
import { getSocket } from "../../lib/socket";
import "./RestaurantLayout.css";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: <MdDashboard /> },
  { to: "/categories", label: "Categories", icon: <MdCategory /> },
  { to: "/menu", label: "Menu", icon: <MdRestaurantMenu /> },
  { to: "/orders", label: "Orders", icon: <MdReceiptLong /> },
];

const RestaurantLayout = () => {
  const { logout, restaurant } = useContext(AuthContext);
  const { push } = useContext(NotificationContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Subscribe to this restaurant's live order feed; toast on every new order.
  useEffect(() => {
    const rid = restaurant?._id;
    if (!rid) return;
    const socket = getSocket();
    socket.emit("restaurant:subscribe", rid);
    const onNewOrder = (p) =>
      push({
        type: "success",
        message: `New order received — ₹${p?.totalAmount ?? ""}`,
        duration: 6000,
      });
    socket.on("order:new", onNewOrder);
    return () => {
      socket.off("order:new", onNewOrder);
      socket.emit("restaurant:unsubscribe", rid);
    };
  }, [restaurant?._id, push]);

  const onLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // close the profile dropdown on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const name = restaurant?.name || "Partner";

  return (
    <div className="al-shell">
      <aside className="al-sidebar">
        <div className="al-brand">
          <div className="al-brand-logo">FW</div>
          <div>
            <p className="al-brand-name">FoodWorld</p>
            <p className="al-brand-sub">Partner console</p>
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
          <MdLogout /> <span>Sign out</span>
        </button>
      </aside>

      <div className="al-main">
        <header className="al-topbar">
          <div />
          <div className="al-topbar-right">
            <div className="al-user-menu" ref={menuRef}>
              <button
                type="button"
                className={`al-user-chip ${menuOpen ? "al-user-chip-open" : ""}`}
                title={restaurant?._id || ""}
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="al-user-avatar">
                  <MdStorefront />
                </span>
                <span className="al-user-label">{name}</span>
                <MdExpandMore className={`al-user-caret ${menuOpen ? "open" : ""}`} />
              </button>

              {menuOpen && (
                <div className="al-user-dropdown" role="menu">
                  <div className="al-user-dropdown-head">
                    <strong>{name}</strong>
                    {restaurant?.phone && <span>{restaurant.phone}</span>}
                  </div>

                  <button className="al-user-dropdown-item" role="menuitem" onClick={() => go("/profile")}>
                    <MdPerson /> Profile
                  </button>
                  <button className="al-user-dropdown-item" role="menuitem" onClick={() => go("/account")}>
                    <MdManageAccounts /> My Account
                  </button>

                  <div className="al-user-dropdown-divider" />

                  <button
                    className="al-user-dropdown-item al-user-dropdown-danger"
                    role="menuitem"
                    onClick={onLogout}
                  >
                    <MdLogout /> Sign out
                  </button>
                </div>
              )}
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

export default RestaurantLayout;

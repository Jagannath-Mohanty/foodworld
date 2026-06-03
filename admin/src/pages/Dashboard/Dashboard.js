import React, { useContext, useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  MdAttachMoney,
  MdShoppingBag,
  MdTrendingUp,
  MdRestaurant,
  MdDeliveryDining,
  MdPerson,
} from "react-icons/md";
import { api } from "../../lib/api";
import { NotificationContext } from "../../context/NotificationContext";
import "./Dashboard.css";

const formatINR = (n) => `₹${(n || 0).toLocaleString("en-IN")}`;

const Dashboard = () => {
  const { push } = useContext(NotificationContext);
  const [stats, setStats] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/admin/stats?days=${days}`)
      .then(setStats)
      .catch((err) => push({ type: "error", message: err.message }))
      .finally(() => setLoading(false));
  }, [days, push]);

  if (loading || !stats) return <div className="state">Loading dashboard…</div>;

  const s = stats.summary;

  const cards = [
    { label: "Total sales", value: formatINR(s.totalSales), icon: <MdAttachMoney />, tone: "primary" },
    { label: "Estimated profit", value: formatINR(s.profit), icon: <MdTrendingUp />, tone: "success" },
    { label: "Total orders", value: s.orders.toLocaleString(), icon: <MdShoppingBag />, tone: "info" },
    { label: "Avg order value", value: formatINR(Math.round(s.avgOrderValue || 0)), icon: <MdAttachMoney />, tone: "warning" },
    { label: "Active restaurants", value: s.restaurantCount, icon: <MdRestaurant />, tone: "info" },
    { label: "Customers", value: s.userCount, icon: <MdPerson />, tone: "info" },
    { label: "Delivery agents", value: s.deliveryAgentCount, icon: <MdDeliveryDining />, tone: "primary" },
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>At-a-glance view of the marketplace.</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          style={{
            padding: "8px 12px",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            background: "var(--color-bg)",
            fontSize: "0.88rem",
          }}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* ===== Stat cards ===== */}
      <div className="dash-grid">
        {cards.map((c, i) => (
          <div key={i} className={`stat-card stat-card-${c.tone}`}>
            <span className="stat-icon">{c.icon}</span>
            <div>
              <p className="stat-label">{c.label}</p>
              <p className="stat-value">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ===== Sales chart ===== */}
      <div className="card" style={{ marginTop: 22 }}>
        <h3 style={{ fontSize: "1rem", marginBottom: 12 }}>
          Sales over last {days} days
        </h3>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <AreaChart data={stats.byDay} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="sales-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff593c" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#ff593c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="_id"
                tickFormatter={(d) => d.slice(5)}
                fontSize={12}
                stroke="#6b7280"
              />
              <YAxis fontSize={12} stroke="#6b7280" tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                formatter={(value, key) => (key === "sales" ? formatINR(value) : value)}
                labelFormatter={(d) => `Date: ${d}`}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#ff593c"
                strokeWidth={2}
                fill="url(#sales-fill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===== Two-column row: top restaurants + status mix ===== */}
      <div className="dash-row-2">
        <div className="card">
          <h3 style={{ fontSize: "1rem", marginBottom: 12 }}>Top restaurants</h3>
          {stats.topRestaurants?.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.88rem" }}>
              Not enough data yet.
            </p>
          ) : (
            <ul className="dash-top-list">
              {stats.topRestaurants.map((r, i) => (
                <li key={r._id}>
                  <span className="dash-rank">{i + 1}</span>
                  {r.image && (
                    <img
                      src={r.image}
                      alt={r.name}
                      style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }}
                    />
                  )}
                  <span className="dash-top-name">{r.name || "Unknown"}</span>
                  <span className="dash-top-amt">{formatINR(r.sales)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: "1rem", marginBottom: 12 }}>Order status mix</h3>
          {stats.byStatus?.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.88rem" }}>
              No orders yet.
            </p>
          ) : (
            <ul className="dash-status-list">
              {stats.byStatus.map((row) => (
                <li key={row._id}>
                  <span className={`badge badge-${row._id === "delivered" ? "success" : row._id === "cancelled" ? "error" : "info"}`}>
                    {row._id.replace(/_/g, " ")}
                  </span>
                  <span className="dash-status-count">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

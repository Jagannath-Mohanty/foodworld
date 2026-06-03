import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MdAdd, MdEdit, MdMenuBook, MdBlock, MdSearch } from "react-icons/md";
import { api } from "../../lib/api";
import { NotificationContext } from "../../context/NotificationContext";
import Pagination from "../../components/Pagination/Pagination";

const Restaurants = () => {
  const { push } = useContext(NotificationContext);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      params.set("page", String(page));
      params.set("limit", "10");
      const data = await api.get(`/restaurants?${params.toString()}`);
      setRestaurants(data.items || []);
      setPagination(data.pagination || null);
    } catch (err) {
      push({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }, [q, page, push]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [q]);

  const deactivate = async (r) => {
    if (!window.confirm(`Deactivate "${r.name}"? It will be hidden from customers.`)) return;
    try {
      await api.del(`/restaurants/${r._id}`);
      push({ type: "success", message: "Restaurant deactivated" });
      load();
    } catch (err) {
      push({ type: "error", message: err.message });
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Restaurants</h1>
          <p>Create, edit, and manage every restaurant on the platform.</p>
        </div>
        <Link to="/restaurants/new" className="btn btn-primary">
          <MdAdd /> New restaurant
        </Link>
      </div>

      <div className="toolbar">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <MdSearch style={{ color: "var(--color-text-muted)" }} />
        </span>
        <input
          type="text"
          placeholder="Search restaurants or cuisines"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, minWidth: 240 }}
        />
      </div>

      {loading ? (
        <div className="state">Loading restaurants…</div>
      ) : restaurants.length === 0 ? (
        <div className="state">
          No restaurants yet. <Link to="/restaurants/new">Create your first one →</Link>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Cuisines</th>
                <th>City</th>
                <th>Rating</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <img
                        src={r.image}
                        alt={r.name}
                        style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }}
                      />
                      <strong>{r.name}</strong>
                    </div>
                  </td>
                  <td>{(r.cuisines || []).slice(0, 3).join(", ")}</td>
                  <td>{r.address?.city}</td>
                  <td>
                    {r.rating?.count > 0
                      ? `${r.rating.average.toFixed(1)} (${r.rating.count})`
                      : "—"}
                  </td>
                  <td>
                    <span className={`badge ${r.isActive ? "badge-success" : "badge-error"}`}>
                      {r.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Link to={`/restaurants/${r._id}/menu`} className="btn btn-secondary btn-sm">
                      <MdMenuBook /> Menu
                    </Link>{" "}
                    <Link to={`/restaurants/${r._id}/edit`} className="btn btn-secondary btn-sm">
                      <MdEdit /> Edit
                    </Link>{" "}
                    {r.isActive && (
                      <button onClick={() => deactivate(r)} className="btn btn-danger btn-sm">
                        <MdBlock /> Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

export default Restaurants;

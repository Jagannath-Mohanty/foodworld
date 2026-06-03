import React, { useCallback, useContext, useEffect, useState } from "react";
import { MdSearch } from "react-icons/md";
import { api } from "../../lib/api";
import { NotificationContext } from "../../context/NotificationContext";
import Pagination from "../../components/Pagination/Pagination";

const ROLES = ["user", "restaurant", "delivery", "admin"];

const ROLE_BADGE = {
  admin: "badge-error",
  delivery: "badge-primary",
  restaurant: "badge-info",
  user: "badge-info",
};

const Users = () => {
  const { push } = useContext(NotificationContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (roleFilter) params.set("role", roleFilter);
      params.set("page", String(page));
      params.set("limit", "10");
      const data = await api.get(`/admin/users?${params.toString()}`);
      setUsers(data.items || []);
      setPagination(data.pagination || null);
    } catch (err) {
      push({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }, [q, roleFilter, page, push]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [q, roleFilter]);

  const changeRole = async (user, role) => {
    if (role === user.role) return;
    if (!window.confirm(`Change ${user.name}'s role from "${user.role || "user"}" to "${role}"?`)) {
      return;
    }
    try {
      await api.put(`/admin/users/${user._id}/role`, { role });
      push({ type: "success", message: `${user.name} is now a ${role}` });
      load();
    } catch (err) {
      push({ type: "error", message: err.message });
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Users</h1>
          <p>Manage accounts and roles across the platform.</p>
        </div>
      </div>

      <div className="toolbar">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <MdSearch style={{ color: "var(--color-text-muted)" }} />
        </span>
        <input
          type="text"
          placeholder="Search by name or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="state">Loading users…</div>
      ) : users.length === 0 ? (
        <div className="state">No users match.</div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Role</th>
                <th>Change role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    <span className={`badge ${ROLE_BADGE[u.role] || "badge-info"}`}>
                      {u.role || "user"}
                    </span>
                  </td>
                  <td>
                    <select
                      value={u.role || "user"}
                      onChange={(e) => changeRole(u, e.target.value)}
                      style={{
                        padding: "5px 8px",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.82rem",
                      }}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
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

export default Users;

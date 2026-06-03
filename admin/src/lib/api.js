/**
 * Thin fetch wrapper. The CRA dev proxy forwards /api → http://localhost:5000,
 * but our existing customer client uses bare paths (/restaurants etc), so we do
 * the same here for consistency.
 *
 * The admin auth middleware on the server expects the JWT in the request body
 * as `token` (legacy compatibility). For GET requests it also accepts an
 * Authorization: Bearer header. We send both so any endpoint works.
 */

// All server routers are mounted under /api. Pages pass router-relative paths
// like "/admin/users" or "/restaurants"; we prepend the base here in one place.
const BASE = "/api";
const withBase = (path) => (path.startsWith("/api") ? path : `${BASE}${path}`);

const cleanToken = () => {
  const raw = localStorage.getItem("admin_token");
  if (!raw) return null;
  return raw.replace(/"/g, "");
};

const buildBody = (body) => {
  const token = cleanToken();
  if (!body) return token ? JSON.stringify({ token }) : undefined;
  return JSON.stringify({ ...body, token });
};

const buildHeaders = () => {
  const headers = { "Content-Type": "application/json" };
  const token = cleanToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export const api = {
  get: async (path) => {
    const res = await fetch(withBase(path), { headers: buildHeaders() });
    return parse(res);
  },
  post: async (path, body) => {
    const res = await fetch(withBase(path), {
      method: "POST",
      headers: buildHeaders(),
      body: buildBody(body),
    });
    return parse(res);
  },
  put: async (path, body) => {
    const res = await fetch(withBase(path), {
      method: "PUT",
      headers: buildHeaders(),
      body: buildBody(body),
    });
    return parse(res);
  },
  del: async (path, body) => {
    const res = await fetch(withBase(path), {
      method: "DELETE",
      headers: buildHeaders(),
      body: buildBody(body),
    });
    return parse(res);
  },
};

const parse = async (res) => {
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const err = new Error((data && data.error) || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
};

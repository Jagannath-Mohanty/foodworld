/**
 * Thin fetch wrapper for the delivery app. Partner endpoints live under
 * /api/delivery on the server; callers pass full paths.
 */

const cleanToken = () => {
  const raw = localStorage.getItem("deliveryman_token");
  if (!raw) return null;
  return raw.replace(/"/g, "");
};

const buildHeaders = () => {
  const headers = { "Content-Type": "application/json" };
  const token = cleanToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const parse = async (res) => {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
};

const request = (method, path, body) =>
  fetch(path, {
    method,
    headers: buildHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).then(parse);

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  patch: (path, body) => request("PATCH", path, body),
  del: (path, body) => request("DELETE", path, body),
};

// Base for delivery-agent routes (server mounts delivery routes under /api).
export const R = "/api/delivery";

import React, { useContext, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import { NotificationContext } from "../../context/NotificationContext";
import "./Login.css";

const Login = () => {
  const { isAuthed, setToken } = useContext(AuthContext);
  const { push } = useContext(NotificationContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthed) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1) Authenticate against the same /login endpoint as the customer app
      const loginRes = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();

      if (!loginRes.ok || !loginData.token) {
        push({ type: "error", message: loginData.error || "Invalid credentials" });
        return;
      }

      // 2) Verify the user actually has admin role by calling an admin-only endpoint
      const verifyRes = await fetch("/api/admin/users?role=admin", {
        headers: { Authorization: `Bearer ${loginData.token}` },
      });

      if (!verifyRes.ok) {
        push({
          type: "error",
          message: "This account does not have admin access.",
        });
        return;
      }

      setToken(loginData.token);
      push({ type: "success", message: "Signed in to admin" });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      push({ type: "error", message: err.message || "Login failed" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="al-page">
      <div className="al-card">
        <div className="al-head">
          <div className="al-logo">FW</div>
          <h1>FoodWorld Admin</h1>
          <p>Sign in with your admin credentials.</p>
        </div>

        <form onSubmit={handleSubmit} className="al-form">
          <label className="al-field">
            <span>Email</span>
            <div className="al-input-wrap">
              <MdEmail className="al-input-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
                autoComplete="email"
              />
            </div>
          </label>

          <label className="al-field">
            <span>Password</span>
            <div className="al-input-wrap">
              <MdLock className="al-input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="al-eye-btn"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
              </button>
            </div>
          </label>

          <button type="submit" className="al-submit-btn" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

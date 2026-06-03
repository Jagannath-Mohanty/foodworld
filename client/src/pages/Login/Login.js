import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { NotificationContext } from "../../context/NotificationContext";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { push } = useContext(NotificationContext);
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();

    const data = { email, password };

    fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          push({ type: "error", message: "Invalid email or password" });
          throw new Error("Invalid email or password");
        }
        return response.json();
      })
      .then((data) => {
        if (!data) {
          push({ type: "error", message: "Invalid user" });
        } else {
          push({ type: "success", message: "Signed in" });
          localStorage.setItem("token", JSON.stringify(data.token));
          navigate("/");
        }
      })
      .catch((err) => setError(err.message));
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-overlay" />
          <div className="login-brand-content">
            <h1>Welcome Back</h1>
            <p>
              Sign in to order your favorite meals, track deliveries, and
              rediscover the joy of great food.
            </p>
            <div className="login-brand-tagline">
              <span>FoodWorld</span> · taste the world
            </div>
          </div>
        </div>

        <div className="login-form-wrap">
          <div className="login-form-inner">
            <h2 className="login-title">Sign in</h2>
            <p className="login-subtitle">
              New here?{" "}
              <Link to="/signup" className="login-link">
                Create an account
              </Link>
            </p>

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <label className="login-field">
                <span className="login-field-label">Email</span>
                <div className="login-input-wrap">
                  <MdEmail className="login-input-icon" />
                  <input
                    className="login-input"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    required
                    placeholder="you@example.com"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </label>

              <label className="login-field">
                <span className="login-field-label">Password</span>
                <div className="login-input-wrap">
                  <MdLock className="login-input-icon" />
                  <input
                    className="login-input"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    required
                    placeholder="Enter your password"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="login-eye-btn"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                  </button>
                </div>
              </label>

              <div className="login-row">
                <label className="login-remember">
                  <input type="checkbox" /> Remember me
                </label>
                <a href="#forgot" className="login-link">
                  Forgot password?
                </a>
              </div>

              <button type="submit" className="login-submit-btn">
                Sign in
              </button>
            </form>

            <p className="login-footnote">
              By continuing you agree to our{" "}
              <a href="#terms" className="login-link">Terms</a> &{" "}
              <a href="#privacy" className="login-link">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

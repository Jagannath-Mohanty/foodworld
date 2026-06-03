import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MdPerson,
  MdEmail,
  MdPhone,
  MdLock,
  MdVisibility,
  MdVisibilityOff,
} from "react-icons/md";
import { NotificationContext } from "../../context/NotificationContext";
import "./Signup.css";

const Signup = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    cpassword: "",
    role: "user",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showCPassword, setShowCPassword] = useState(false);
  const { push } = useContext(NotificationContext);

  const handleInputs = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const PostData = async (e) => {
    e.preventDefault();
    setError("");

    if (user.password !== user.cpassword) {
      setError("Passwords do not match");
      return;
    }

    const { name, email, phone, password, cpassword } = user;
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password, cpassword }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data?.error || "Invalid registration");
    } else {
      push({ type: "success", message: "Registration successful — please sign in" });
      navigate("/login");
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        <div className="signup-brand">
          <div className="signup-brand-overlay" />
          <div className="signup-brand-content">
            <h1>Join FoodWorld</h1>
            <p>
              Create your free account to order from your favorite restaurants,
              save addresses, and earn rewards on every meal.
            </p>
            <ul className="signup-brand-perks">
              <li>Personalized recommendations</li>
              <li>Faster checkout</li>
              <li>Exclusive member-only offers</li>
            </ul>
          </div>
        </div>

        <div className="signup-form-wrap">
          <div className="signup-form-inner">
            <h2 className="signup-title">Create your account</h2>
            <p className="signup-subtitle">
              Already have one?{" "}
              <Link to="/login" className="signup-link">
                Sign in
              </Link>
            </p>

            {error && <div className="signup-error">{error}</div>}

            <form onSubmit={PostData} className="signup-form">
              <label className="signup-field">
                <span className="signup-field-label">Full name</span>
                <div className="signup-input-wrap">
                  <MdPerson className="signup-input-icon" />
                  <input
                    className="signup-input"
                    type="text"
                    name="name"
                    required
                    autoComplete="off"
                    value={user.name}
                    onChange={handleInputs}
                    placeholder="Jane Doe"
                  />
                </div>
              </label>

              <label className="signup-field">
                <span className="signup-field-label">Email</span>
                <div className="signup-input-wrap">
                  <MdEmail className="signup-input-icon" />
                  <input
                    className="signup-input"
                    type="email"
                    name="email"
                    required
                    autoComplete="off"
                    value={user.email}
                    onChange={handleInputs}
                    placeholder="you@example.com"
                  />
                </div>
              </label>

              <label className="signup-field">
                <span className="signup-field-label">Mobile number</span>
                <div className="signup-input-wrap">
                  <MdPhone className="signup-input-icon" />
                  <input
                    className="signup-input"
                    type="tel"
                    name="phone"
                    required
                    autoComplete="off"
                    value={user.phone}
                    onChange={handleInputs}
                    placeholder="+1 555 123 4567"
                  />
                </div>
              </label>

              <div className="signup-grid-2">
                <label className="signup-field">
                  <span className="signup-field-label">Password</span>
                  <div className="signup-input-wrap">
                    <MdLock className="signup-input-icon" />
                    <input
                      className="signup-input"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      autoComplete="new-password"
                      value={user.password}
                      onChange={handleInputs}
                      placeholder="Create password"
                    />
                    <button
                      type="button"
                      className="signup-eye-btn"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                    </button>
                  </div>
                </label>

                <label className="signup-field">
                  <span className="signup-field-label">Confirm password</span>
                  <div className="signup-input-wrap">
                    <MdLock className="signup-input-icon" />
                    <input
                      className="signup-input"
                      type={showCPassword ? "text" : "password"}
                      name="cpassword"
                      required
                      autoComplete="new-password"
                      value={user.cpassword}
                      onChange={handleInputs}
                      placeholder="Repeat password"
                    />
                    <button
                      type="button"
                      className="signup-eye-btn"
                      onClick={() => setShowCPassword((s) => !s)}
                      aria-label={showCPassword ? "Hide password" : "Show password"}
                    >
                      {showCPassword ? <MdVisibilityOff /> : <MdVisibility />}
                    </button>
                  </div>
                </label>
              </div>

              <label className="signup-terms">
                <input type="checkbox" required />
                <span>
                  I agree to the{" "}
                  <a href="#terms" className="signup-link">Terms</a> &{" "}
                  <a href="#privacy" className="signup-link">Privacy Policy</a>
                </span>
              </label>

              <button type="submit" className="signup-submit-btn">
                Create account
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;

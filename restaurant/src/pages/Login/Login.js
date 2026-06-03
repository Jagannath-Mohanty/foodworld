import React, { useContext, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { MdPhone, MdPassword } from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import { NotificationContext } from "../../context/NotificationContext";
import { api, R } from "../../lib/api";
import "./Login.css";

const Login = () => {
  const { isAuthed, isOnboarded, setSession } = useContext(AuthContext);
  const { push } = useContext(NotificationContext);
  const navigate = useNavigate();

  const [step, setStep] = useState("phone"); // 'phone' | 'otp'
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthed) {
    return <Navigate to={isOnboarded ? "/dashboard" : "/onboarding"} replace />;
  }

  const sendOtp = async (e) => {
    e?.preventDefault();
    if (phone.length !== 10) {
      push({ type: "error", message: "Enter a valid 10-digit phone number" });
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`${R}/register`, { phone });
      push({ type: "success", message: "OTP sent — check the server console" });
      setStep("otp");
    } catch (err) {
      push({ type: "error", message: err.message || "Could not send OTP" });
    } finally {
      setSubmitting(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await api.post(`${R}/auth/verify-otp`, { phone, otp });
      if (!data.token) {
        push({ type: "error", message: "Verification failed" });
        return;
      }
      setSession(data.token, data.restaurant);
      push({ type: "success", message: "Signed in" });
      navigate(data.restaurant?.name ? "/dashboard" : "/onboarding", {
        replace: true,
      });
    } catch (err) {
      push({ type: "error", message: err.message || "Invalid or expired OTP" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="al-page">
      <div className="al-card">
        <div className="al-head">
          <div className="al-logo">FW</div>
          <h1>Partner sign in</h1>
          <p>
            {step === "phone"
              ? "Enter your restaurant's phone number to receive an OTP."
              : `Enter the 6-digit code sent to ${phone}.`}
          </p>
        </div>

        {step === "phone" ? (
          <form onSubmit={sendOtp} className="al-form">
            <label className="al-field">
              <span>Phone number</span>
              <div className="al-input-wrap">
                <MdPhone className="al-input-icon" />
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  required
                  placeholder="9876543210"
                  autoComplete="tel"
                />
              </div>
            </label>

            <button type="submit" className="al-submit-btn" disabled={submitting}>
              {submitting ? "Sending…" : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="al-form">
            <label className="al-field al-otp-input">
              <span>One-time password</span>
              <div className="al-input-wrap">
                <MdPassword className="al-input-icon" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  required
                  placeholder="······"
                  autoComplete="one-time-code"
                />
              </div>
            </label>

            <button type="submit" className="al-submit-btn" disabled={submitting}>
              {submitting ? "Verifying…" : "Verify & continue"}
            </button>

            <div className="al-login-foot">
              <button
                type="button"
                className="al-link-btn"
                onClick={() => setStep("phone")}
              >
                ← Change number
              </button>
              <button
                type="button"
                className="al-link-btn"
                onClick={sendOtp}
                disabled={submitting}
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;

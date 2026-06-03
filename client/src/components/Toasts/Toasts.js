import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { MdCheckCircle, MdInfo, MdClose, MdError } from "react-icons/md";
import { NotificationContext } from "../../context/NotificationContext";
import "./Toasts.css";

const Toasts = () => {
  const { toasts, dismiss } = useContext(NotificationContext);

  if (!toasts.length) return null;

  return (
    <div className="toasts" role="region" aria-live="polite" aria-label="Notifications">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type || "info"}`}>
          <span className="toast-icon">
            {t.type === "success" ? (
              <MdCheckCircle />
            ) : t.type === "error" ? (
              <MdError />
            ) : (
              <MdInfo />
            )}
          </span>
          <div className="toast-body">
            <p>{t.message}</p>
            {t.orderId && (
              <Link to={`/orders/${t.orderId}`} className="toast-link">
                Track order →
              </Link>
            )}
          </div>
          <button
            type="button"
            className="toast-close"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
          >
            <MdClose />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toasts;

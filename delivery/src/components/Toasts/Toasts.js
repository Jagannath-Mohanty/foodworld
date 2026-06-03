import React, { useContext } from "react";
import { MdCheckCircle, MdError, MdInfo, MdClose } from "react-icons/md";
import { NotificationContext } from "../../context/NotificationContext";
import "./Toasts.css";

const Toasts = () => {
  const { toasts, dismiss } = useContext(NotificationContext);
  if (!toasts.length) return null;

  return (
    <div className="toasts" role="region" aria-live="polite">
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
          <p className="toast-body">{t.message}</p>
          <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss">
            <MdClose />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toasts;

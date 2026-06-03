import { createContext, useCallback, useEffect, useState } from "react";
import { getSocket } from "../lib/socket";

export const NotificationContext = createContext(null);

const STATUS_LABELS = {
  placed: "Order placed",
  accepted: "Restaurant accepted your order",
  preparing: "Your order is being prepared",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  delivered: "Order delivered",
  cancelled: "Order cancelled",
};

/* Decode the user's _id out of the JWT in localStorage without bringing in a library. */
const userIdFromToken = () => {
  try {
    const raw = localStorage.getItem("token");
    if (!raw) return null;
    const cleaned = raw.replace(/"/g, "");
    const payload = JSON.parse(atob(cleaned.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload._id || null;
  } catch {
    return null;
  }
};

const NotificationContextProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]); // [{ id, type, message }]

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((toast) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toast.duration ?? 4000);
  }, []);

  /* Subscribe to user-scoped server events */
  useEffect(() => {
    const userId = userIdFromToken();
    if (!userId) return undefined;

    const s = getSocket();
    s.emit("user:subscribe", userId);

    const onStatus = (payload) => {
      push({
        type: "info",
        message: STATUS_LABELS[payload.status] || `Order: ${payload.status}`,
        orderId: payload.orderId,
      });
    };
    const onPlaced = (payload) => {
      push({
        type: "success",
        message: "Order placed — we'll keep you posted",
        orderId: payload.orderId,
      });
    };

    s.on("order:status", onStatus);
    s.on("order:placed", onPlaced);

    return () => {
      s.off("order:status", onStatus);
      s.off("order:placed", onPlaced);
      s.emit("user:unsubscribe", userId);
    };
  }, [push]);

  return (
    <NotificationContext.Provider value={{ toasts, push, dismiss }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContextProvider;

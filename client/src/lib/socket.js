import { io } from "socket.io-client";
import { useEffect, useState } from "react";

let socket = null;

/**
 * Returns the singleton socket.io client. Lazily connects on first call.
 * Connects to the same origin in production; uses :5000 explicitly in dev so
 * the WebSocket bypasses CRA's HTTP-only dev proxy.
 */
export const getSocket = () => {
  if (socket) return socket;
  const url =
    process.env.NODE_ENV === "development"
      ? "http://localhost:5000"
      : window.location.origin;
  socket = io(url, { transports: ["websocket", "polling"], autoConnect: true });
  return socket;
};

/**
 * Subscribe to live updates for a single order.
 * Usage:
 *   const update = useOrderUpdates(orderId);
 *   // update is { status, timeline, ... } pushed from the server, or null until first event
 */
export const useOrderUpdates = (orderId) => {
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (!orderId) return undefined;
    const s = getSocket();
    s.emit("order:subscribe", orderId);

    const handler = (payload) => {
      if (payload?.orderId === orderId) setLastUpdate(payload);
    };
    s.on("order:update", handler);

    return () => {
      s.off("order:update", handler);
      s.emit("order:unsubscribe", orderId);
    };
  }, [orderId]);

  return lastUpdate;
};

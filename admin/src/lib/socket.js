import { io } from "socket.io-client";
import { useEffect, useState } from "react";

let socket = null;

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
 * Subscribe to a stream of order:update payloads, regardless of which order.
 * Used by the live orders board to refresh rows in place.
 */
export const useAnyOrderUpdate = () => {
  const [last, setLast] = useState(null);
  useEffect(() => {
    const s = getSocket();
    const handler = (payload) => setLast({ ...payload, _seq: Date.now() });
    s.on("order:update", handler);
    return () => s.off("order:update", handler);
  }, []);
  return last;
};

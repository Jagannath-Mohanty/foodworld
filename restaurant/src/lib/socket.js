import { io } from "socket.io-client";

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

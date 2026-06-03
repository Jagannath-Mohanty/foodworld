import { Server } from "socket.io";

let io = null;

/**
 * Attach Socket.IO to an existing HTTP server.
 * Call once during app bootstrap.
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*", // dev only — tighten in prod
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("[socket] client connected:", socket.id);

    // Client subscribes to a specific order channel: socket.emit('order:subscribe', orderId)
    socket.on("order:subscribe", (orderId) => {
      if (!orderId) return;
      socket.join(`order:${orderId}`);
      console.log(`[socket] ${socket.id} joined order:${orderId}`);
    });

    socket.on("order:unsubscribe", (orderId) => {
      if (!orderId) return;
      socket.leave(`order:${orderId}`);
    });

    // Per-user inbox for cross-order notifications (toasts, order placed, etc.)
    socket.on("user:subscribe", (userId) => {
      if (!userId) return;
      socket.join(`user:${userId}`);
    });

    socket.on("user:unsubscribe", (userId) => {
      if (!userId) return;
      socket.leave(`user:${userId}`);
    });

    // Restaurant partner inbox: new orders, etc. socket.emit('restaurant:subscribe', restaurantId)
    socket.on("restaurant:subscribe", (restaurantId) => {
      if (!restaurantId) return;
      socket.join(`restaurant:${restaurantId}`);
      console.log(`[socket] ${socket.id} joined restaurant:${restaurantId}`);
    });

    socket.on("restaurant:unsubscribe", (restaurantId) => {
      if (!restaurantId) return;
      socket.leave(`restaurant:${restaurantId}`);
    });

    // Delivery agents who are "online" join a shared room to receive new-order pings.
    socket.on("delivery:subscribe", () => {
      socket.join("delivery");
      console.log(`[socket] ${socket.id} joined delivery room`);
    });

    socket.on("delivery:unsubscribe", () => {
      socket.leave("delivery");
    });

    socket.on("disconnect", () => {
      console.log("[socket] client disconnected:", socket.id);
    });
  });

  return io;
};

/**
 * Emit a custom event to one user (across any of their connected tabs/devices).
 */
export const emitToUser = (userId, event, payload) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
};

/**
 * Emit a custom event to one restaurant partner (e.g. a new incoming order).
 */
export const emitToRestaurant = (restaurantId, event, payload) => {
  if (!io) return;
  io.to(`restaurant:${restaurantId}`).emit(event, payload);
};

/**
 * Broadcast to all online delivery agents (room "delivery") — e.g. an order
 * just became ready for pickup, or was taken by someone else.
 */
export const emitToDeliveryAgents = (event, payload) => {
  if (!io) return;
  io.to("delivery").emit(event, payload);
};

/**
 * Emit an update for one order — anyone subscribed to that order receives it.
 * Call this from order-status-changing routes.
 */
export const emitOrderUpdate = (orderId, payload) => {
  if (!io) {
    console.warn("[socket] emitOrderUpdate called before init");
    return;
  }
  io.to(`order:${orderId}`).emit("order:update", { orderId, ...payload });
};

export const getIO = () => io;

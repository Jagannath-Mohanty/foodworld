import { Router } from "express";
import Order from "../model/Order.js";
import Users from "../model/userSchema.js";
import Restaurant from "../model/restaurantSchema.js";
import DeliveryMan from "../model/deliveryManSchema.js";
import Authenticate_DeliveryMan from "../middleware/authenticate_deliveryman.js";
import Authenticate_admin from "../middleware/authenticate_admin.js";
import { emitOrderUpdate, emitToUser, emitToDeliveryAgents } from "../socket.js";
import { sendOrderStatusEmail } from "../lib/mailer.js";
import { generateOTP, sendOTPViaSMS, generateAuthToken } from "../util.js";
import Otp from "../model/otpSchema.js";
import { buildPagination, parsePagination } from "../util.js";

const router = Router();

/** Notify the customer about a status change via socket + email (fire-and-forget). */
const notifyCustomerOfStatus = async (order) => {
  try {
    emitToUser(String(order.customerId), "order:status", {
      orderId: order._id,
      status: order.status,
    });
    const customer = await Users.findById(order.customerId).select("email");
    if (customer?.email) {
      sendOrderStatusEmail({ to: customer.email, order, status: order.status }).catch(() => {});
    }
  } catch (err) {
    console.error("notifyCustomerOfStatus:", err.message);
  }
};

/** Ping all online delivery agents that an order is ready for pickup. */
export const notifyAgentsOrderReady = async (order) => {
  try {
    const restaurant = await Restaurant.findById(order.restaurantId).select("name location address");
    emitToDeliveryAgents("delivery:order-available", {
      orderId: order._id,
      restaurantName: restaurant?.name || "Restaurant",
      pickup: restaurant?.location?.coordinates || null, // [lng, lat]
      drop: order.deliveryAddress?.location?.coordinates || null,
      total: order.totalAmount,
    });
  } catch (err) {
    console.error("notifyAgentsOrderReady:", err.message);
  }
};

/* ============================================================
 * Delivery agent — phone OTP auth (DeliveryMan accounts created by admin)
 * ============================================================ */

// POST /delivery/auth/send-otp
router.post("/delivery/auth/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone number is required" });

    const agent = await DeliveryMan.findOne({ phone });
    if (!agent) {
      return res.status(404).json({
        error: "No delivery account for this phone. Ask the admin to register you.",
      });
    }

    const otp = await generateOTP(phone);
    await sendOTPViaSMS(phone, otp.otp);
    res.json({ message: "OTP sent", deliveryManId: agent._id });
  } catch (err) {
    console.error("delivery send-otp:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// POST /delivery/auth/verify-otp
router.post("/delivery/auth/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: "Phone and OTP are required" });

    const verifyOtp = await Otp.findOne({ phone: String(phone), otp: String(otp), isExpiry: false });
    if (!verifyOtp) return res.status(400).json({ error: "Invalid or expired OTP" });

    const agent = await DeliveryMan.findOne({ phone });
    if (!agent) return res.status(404).json({ error: "Delivery agent not found" });

    verifyOtp.isExpiry = true;
    await verifyOtp.save();

    const token = generateAuthToken(agent); // { id, phone, role, name }
    agent.isPhoneVerified = true;
    await agent.save();

    res.json({
      message: "Login successful",
      token,
      agent: {
        _id: agent._id,
        name: agent.name,
        phone: agent.phone,
        vehicleNumber: agent.vehicleNumber,
        isAvailable: agent.isAvailable,
      },
    });
  } catch (err) {
    console.error("delivery verify-otp:", err);
    res.status(500).json({ error: "OTP verification failed" });
  }
});

/* ============================================================
 * Delivery agent — availability & live location
 * ============================================================ */

// POST /delivery/availability — go online/offline
router.post("/delivery/availability", Authenticate_DeliveryMan, async (req, res) => {
  try {
    req.agent.isAvailable = !!req.body.isAvailable;
    await req.agent.save();
    res.json({ isAvailable: req.agent.isAvailable });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /delivery/location — agent reports its live GPS position
router.post("/delivery/location", Authenticate_DeliveryMan, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({ error: "lat and lng are required" });
    }
    req.agent.location = { type: "Point", coordinates: [lng, lat] };
    await req.agent.save();

    // Stream the agent's position to the customer tracking their active order.
    const active = await Order.findOne({
      deliveryAgentId: req.agent._id,
      status: "out_for_delivery",
    }).select("_id");
    if (active) emitOrderUpdate(String(active._id), { agentLocation: { lat, lng } });

    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ============================================================
 * Delivery agent — order endpoints
 * ============================================================ */

// GET /delivery/orders/available — unassigned, ready_for_pickup
router.get("/delivery/orders/available", Authenticate_DeliveryMan, async (req, res) => {
  try {
    const filter = { status: "ready_for_pickup", deliveryAgentId: null };
    const { page, limit, skip } = parsePagination(req, { defaultLimit: 10, maxLimit: 50 });
    const [total, orders] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate("restaurantId", "name address phone location"),
    ]);
    res.json({ items: orders, pagination: buildPagination(total, page, limit) });
  } catch (err) {
    console.error("GET /delivery/orders/available:", err);
    res.status(500).json({ error: "Failed to fetch available orders" });
  }
});

// GET /delivery/orders/mine — orders this agent is currently delivering
router.get("/delivery/orders/mine", Authenticate_DeliveryMan, async (req, res) => {
  try {
    const filter = {
      deliveryAgentId: req.agent._id,
      status: { $in: ["out_for_delivery"] },
    };
    const { page, limit, skip } = parsePagination(req, { defaultLimit: 10, maxLimit: 50 });
    const [total, orders] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("restaurantId", "name address phone location")
        .populate("customerId", "name phone"),
    ]);
    res.json({ items: orders, pagination: buildPagination(total, page, limit) });
  } catch (err) {
    console.error("GET /delivery/orders/mine:", err);
    res.status(500).json({ error: "Failed to fetch your deliveries" });
  }
});

// POST /delivery/orders/:id/accept — assign self + move to out_for_delivery
router.post("/delivery/orders/:id/accept", Authenticate_DeliveryMan, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.status !== "ready_for_pickup") {
      return res.status(400).json({ error: "Order is not ready for pickup" });
    }
    if (order.deliveryAgentId) return res.status(409).json({ error: "Already assigned" });

    order.deliveryAgentId = req.agent._id;
    order.transitionTo("out_for_delivery", `Picked up by ${req.agent.name}`);
    await order.save();

    emitOrderUpdate(String(order._id), {
      status: order.status,
      timeline: order.timeline,
      deliveryAgentId: order.deliveryAgentId,
    });
    notifyCustomerOfStatus(order);
    // Tell other agents this one is taken so it leaves their available list.
    emitToDeliveryAgents("delivery:order-taken", { orderId: order._id });

    const populated = await order.populate("restaurantId", "name address phone location");
    res.json(populated);
  } catch (err) {
    console.error("POST /delivery/orders/:id/accept:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /delivery/orders/:id/deliver — mark delivered
router.post("/delivery/orders/:id/deliver", Authenticate_DeliveryMan, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (String(order.deliveryAgentId) !== String(req.agent._id)) {
      return res.status(403).json({ error: "Not your delivery" });
    }
    if (order.status !== "out_for_delivery") {
      return res.status(400).json({ error: "Order is not out for delivery" });
    }

    order.transitionTo("delivered", "Delivered to customer");
    await order.save();

    emitOrderUpdate(String(order._id), { status: order.status, timeline: order.timeline });
    notifyCustomerOfStatus(order);

    res.json(order);
  } catch (err) {
    console.error("POST /delivery/orders/:id/deliver:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
 * Admin: move orders through earlier statuses (so deliveries can appear)
 * ============================================================ */

// PUT /admin/orders/:id/status — admin transitions order to next state
router.put("/admin/orders/:id/status", Authenticate_admin, async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.transitionTo(status, note || "");
    await order.save();

    emitOrderUpdate(String(order._id), { status: order.status, timeline: order.timeline });
    notifyCustomerOfStatus(order);
    if (order.status === "ready_for_pickup") notifyAgentsOrderReady(order);

    res.json(order);
  } catch (err) {
    console.error("PUT /admin/orders/:id/status:", err);
    res.status(400).json({ error: err.message });
  }
});

// GET /admin/orders — list all orders, newest first
router.get("/admin/orders", Authenticate_admin, async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req, { defaultLimit: 10, maxLimit: 50 });
    const [total, orders] = await Promise.all([
      Order.countDocuments({}),
      Order.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("restaurantId", "name")
        .populate("customerId", "name email phone")
        .populate("deliveryAgentId", "name phone"),
    ]);
    res.json({ items: orders, pagination: buildPagination(total, page, limit) });
  } catch (err) {
    console.error("GET /admin/orders:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

export default router;

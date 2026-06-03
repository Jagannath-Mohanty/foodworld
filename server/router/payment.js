import { Router } from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import jwt from "jsonwebtoken";
import { config } from "dotenv";
import Users from "../model/userSchema.js";
import Order from "../model/Order.js";
import { emitOrderUpdate } from "../socket.js";

config({ path: "./config.env" });

const router = Router();

/* Lazy singleton: the Razorpay SDK validates key_id at construction time, so we
 * only build it on first use — keeps the server bootable without Razorpay env vars. */
let razorpayClient = null;
const getRazorpay = () => {
  if (razorpayClient) return razorpayClient;
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  razorpayClient = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  return razorpayClient;
};

const findUserByToken = async (token) => {
  if (!token) return null;
  const cleaned = token.replace(/"/g, "");
  const verified = jwt.verify(cleaned, process.env.SECRET_KEY);
  return Users.findById(verified.id || verified._id);
};

/**
 * POST /payment/create-order
 * Body: { token, amount, currency?, orderId? }
 *   - amount in INR rupees (we convert to paise for Razorpay)
 *   - orderId optional; if provided, the Razorpay order id is stored on our Order
 * Returns: { razorpayOrderId, amount, currency, keyId }
 */
router.post("/payment/create-order", async (req, res) => {
  try {
    const { token, amount, currency = "INR", orderId } = req.body;
    const user = await findUserByToken(token);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(500).json({
        error: "Payment gateway not configured (set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET)",
      });
    }

    const rpOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency,
      receipt: `rcpt_${Date.now()}`,
      notes: { userId: String(user._id), foodworldOrderId: orderId || "" },
    });

    // If we already have a placed Order, attach the gateway id to it
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        paymentMethod: "razorpay",
        paymentId: rpOrder.id,
        paymentStatus: "pending",
      });
    }

    res.json({
      razorpayOrderId: rpOrder.id,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("POST /payment/create-order:", err);
    res.status(500).json({ error: err.message || "Failed to create payment order" });
  }
});

/**
 * POST /payment/verify
 * Body: { token, razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }
 * Verifies the HMAC signature, then marks the matching Order paid.
 */
router.post("/payment/verify", async (req, res) => {
  try {
    const {
      token,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    const user = await findUserByToken(token);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment fields" });
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, { paymentStatus: "failed" });
      }
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    let updatedOrder = null;
    if (orderId) {
      updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          paymentStatus: "paid",
          paymentId: razorpay_payment_id,
          paymentSignature: razorpay_signature,
        },
        { new: true }
      );

      if (updatedOrder) {
        emitOrderUpdate(String(updatedOrder._id), {
          paymentStatus: "paid",
          status: updatedOrder.status,
        });
      }
    }

    res.json({ message: "Payment verified", order: updatedOrder });
  } catch (err) {
    console.error("POST /payment/verify:", err);
    res.status(500).json({ error: err.message || "Verification failed" });
  }
});

export default router;

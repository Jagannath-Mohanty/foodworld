import nodemailer from "nodemailer";
import { config } from "dotenv";

config({ path: "./config.env" });

let transporter = null;

const init = () => {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(
      "[mailer] SMTP not configured — emails will be logged but not sent. " +
        "Set SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM."
    );
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
};

/**
 * Send a transactional email. Silently no-ops when SMTP isn't configured —
 * call sites should not be coupled to delivery success.
 */
export const sendMail = async ({ to, subject, html, text }) => {
  if (!to) return null;
  const tx = init();
  const from = process.env.SMTP_FROM || "FoodWorld <no-reply@foodworld.local>";

  if (!tx) {
    console.log(`[mailer:dryrun] -> ${to} | ${subject}`);
    return null;
  }

  try {
    const info = await tx.sendMail({ from, to, subject, html, text });
    console.log(`[mailer] sent ${info.messageId} -> ${to}`);
    return info;
  } catch (err) {
    console.error("[mailer] send failed:", err.message);
    return null;
  }
};

/* ============================================================
 * Templates
 * ============================================================ */

export const sendOrderPlacedEmail = ({ to, order, restaurantName }) =>
  sendMail({
    to,
    subject: `Order confirmed — ${restaurantName || "FoodWorld"}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 540px; margin: auto;">
        <h2 style="color: #ff593c;">Your order is placed!</h2>
        <p>Thanks for ordering from <strong>${restaurantName || "FoodWorld"}</strong>. We'll keep you posted as it moves along.</p>
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Total:</strong> ₹${order.totalAmount}</p>
        <p><strong>Payment:</strong> ${order.paymentMethod}${order.paymentStatus !== "pending" ? ` · ${order.paymentStatus}` : ""}</p>
        <hr/>
        <p style="color: #6b7280;">Track this order anytime from your account.</p>
      </div>
    `,
  });

export const sendOrderStatusEmail = ({ to, order, status }) => {
  const labels = {
    accepted: "accepted by the restaurant",
    preparing: "being prepared",
    ready_for_pickup: "ready for pickup",
    out_for_delivery: "out for delivery",
    delivered: "delivered — enjoy!",
    cancelled: "cancelled",
  };
  return sendMail({
    to,
    subject: `Order #${String(order._id).slice(-6).toUpperCase()} — ${labels[status] || status}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 540px; margin: auto;">
        <h3>Status update</h3>
        <p>Your order is now <strong>${labels[status] || status}</strong>.</p>
        <p><strong>Order ID:</strong> ${order._id}</p>
      </div>
    `,
  });
};

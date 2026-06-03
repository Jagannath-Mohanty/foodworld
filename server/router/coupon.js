import { Router } from "express";
import jwt from "jsonwebtoken";
import Coupon from "../model/couponSchema.js";
import Users from "../model/userSchema.js";
import Authenticate_admin from "../middleware/authenticate_admin.js";
import { buildPagination, parsePagination } from "../util.js";

const router = Router();

const userFromToken = async (token) => {
  if (!token) return null;
  const cleaned = token.replace(/"/g, "");
  const verified = jwt.verify(cleaned, process.env.SECRET_KEY);
  return Users.findById(verified.id || verified._id);
};

/* ===== Admin: manage coupons ===== */

router.post("/coupons", Authenticate_admin, async (req, res) => {
  try {
    const { token, ...payload } = req.body;
    const coupon = await Coupon.create(payload);
    res.status(201).json(coupon);
  } catch (err) {
    console.error("POST /coupons:", err);
    res.status(400).json({ error: err.message });
  }
});

router.get("/coupons", Authenticate_admin, async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req, { defaultLimit: 10, maxLimit: 50 });
    const [total, coupons] = await Promise.all([
      Coupon.countDocuments({}),
      Coupon.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);
    res.json({ items: coupons, pagination: buildPagination(total, page, limit) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch coupons" });
  }
});

/* ===== Public: list currently-active coupons (for "available offers" UI) ===== */

router.get("/coupons/available", async (req, res) => {
  try {
    const now = new Date();
    const filter = {
      isActive: true,
      validFrom: { $lte: now },
      expiresAt: { $gte: now },
    };
    const { page, limit, skip } = parsePagination(req, { defaultLimit: 10, maxLimit: 50 });
    const [total, coupons] = await Promise.all([
      Coupon.countDocuments(filter),
      Coupon.find(filter)
        .select("code description type value minOrderAmount maxDiscount expiresAt")
        .sort({ expiresAt: 1 })
        .skip(skip)
        .limit(limit),
    ]);
    res.json({ items: coupons, pagination: buildPagination(total, page, limit) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch coupons" });
  }
});

/* ===== User: validate a code against a given subtotal ===== */

router.post("/coupons/apply", async (req, res) => {
  try {
    const { token, code, subtotal } = req.body;
    const user = await userFromToken(token);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (!code || subtotal == null) {
      return res.status(400).json({ error: "code and subtotal required" });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (!coupon) return res.status(404).json({ error: "Coupon not found" });

    const result = coupon.computeDiscount(subtotal);
    if (!result.ok) return res.status(400).json({ error: result.reason });

    res.json({
      code: coupon.code,
      discount: result.discount,
      type: coupon.type,
      value: coupon.value,
    });
  } catch (err) {
    console.error("POST /coupons/apply:", err);
    res.status(500).json({ error: "Failed to apply coupon" });
  }
});

export default router;

import mongoose from "mongoose";

const { Schema } = mongoose;

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: { type: String, default: "" },
    type: { type: String, enum: ["flat", "percent"], required: true },
    value: { type: Number, required: true, min: 0 }, // amount in INR (flat) or % (percent)
    minOrderAmount: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, default: null }, // cap for percent coupons

    validFrom: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },

    usageLimit: { type: Number, default: null },   // total uses (null = unlimited)
    perUserLimit: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/**
 * Returns { ok, discount } or { ok: false, reason } without saving anything.
 * Order amount is the subtotal BEFORE delivery fee.
 */
couponSchema.methods.computeDiscount = function (orderSubtotal) {
  const now = new Date();
  if (!this.isActive) return { ok: false, reason: "Coupon is inactive" };
  if (this.validFrom && now < this.validFrom) return { ok: false, reason: "Coupon not yet active" };
  if (this.expiresAt && now > this.expiresAt) return { ok: false, reason: "Coupon expired" };
  if (this.usageLimit != null && this.usedCount >= this.usageLimit) {
    return { ok: false, reason: "Coupon usage limit reached" };
  }
  if (orderSubtotal < this.minOrderAmount) {
    return { ok: false, reason: `Minimum order ₹${this.minOrderAmount}` };
  }

  let discount =
    this.type === "flat"
      ? this.value
      : Math.floor((orderSubtotal * this.value) / 100);
  if (this.maxDiscount != null) discount = Math.min(discount, this.maxDiscount);
  discount = Math.min(discount, orderSubtotal);

  return { ok: true, discount };
};

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;

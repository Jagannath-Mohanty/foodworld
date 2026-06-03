import mongoose from "mongoose";

const { Schema } = mongoose;

export const ORDER_STATUSES = [
  "placed",            // user placed; awaiting restaurant accept
  "accepted",          // restaurant accepted
  "preparing",         // kitchen preparing
  "ready_for_pickup",  // packed, awaiting delivery agent
  "out_for_delivery",  // picked up by agent
  "delivered",
  "cancelled",
];

const orderItemSchema = new Schema(
  {
    _id: { type: String, required: true },     // MenuItem _id (or legacy id)
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    description: { type: String, default: "" },
    category: { type: String, default: "" },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
  },
  { _id: false }
);

const timelineEventSchema = new Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    at: { type: Date, default: Date.now },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const deliveryAddressSchema = new Schema(
  {
    label: { type: String, default: "" },        // "Home", "Office"
    line1: { type: String, required: true },
    line2: { type: String, default: "" },
    city: { type: String, default: "" },
    pincode: { type: String, default: "" },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: undefined }, // [lng, lat] (optional)
    },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      index: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      index: true,
    },
    deliveryAgentId: {
      type: Schema.Types.ObjectId,
      ref: "DeliveryMan",
      default: null,
      index: true,
    },

    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },

    deliveryAddress: { type: deliveryAddressSchema },

    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "placed",
      index: true,
    },
    timeline: {
      type: [timelineEventSchema],
      default: () => [{ status: "placed", at: new Date() }],
    },

    estimatedDeliveryTime: { type: Date },

    // Phase 4: payment
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "razorpay", "stripe"],
      default: "cod",
    },
    paymentId: { type: String, default: null },     // gateway order id
    paymentSignature: { type: String, default: null },

    couponCode: { type: String, default: null },
    couponDiscount: { type: Number, default: 0, min: 0 },

    // Optional rating after delivery (Phase 6.1 will detail this)
    ratedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

/* Push a new status onto the timeline whenever status changes via .save() flow. */
orderSchema.methods.transitionTo = function (status, note = "") {
  if (!ORDER_STATUSES.includes(status)) {
    throw new Error(`Invalid order status: ${status}`);
  }
  this.status = status;
  this.timeline.push({ status, note, at: new Date() });
  return this;
};

const Order = mongoose.model("Order", orderSchema);

export default Order;

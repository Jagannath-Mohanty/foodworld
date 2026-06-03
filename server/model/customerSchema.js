import mongoose from "mongoose";
import { config } from "dotenv";

config({ path: "./config.env" });

// Saved delivery address — shape kept compatible with Order.deliveryAddress
const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home" }, // "Home", "Work", "Other"
    line1: { type: String, required: true },
    line2: { type: String, default: "" },
    city: { type: String, default: "" },
    pincode: { type: String, default: "" },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: undefined }, // [lng, lat]
    },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  phone: {
    type: Number,
    required: true,
    unique: true,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },

  orders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
  ],
  addresses: [addressSchema],
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});


const Customer = mongoose.model("Customer", customerSchema);
export default Customer;

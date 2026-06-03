import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { config } from "dotenv";

config({ path: "./config.env" });

const { Schema } = mongoose;

const addressSchema = new Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: { type: String },
  },
  { _id: false }
);

// GeoJSON Point — supports MongoDB 2dsphere index for geo queries (added in Phase 2.3)
const locationSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 2,
        message: "coordinates must be [longitude, latitude]",
      },
    },
  },
  { _id: false }
);

const openHoursSchema = new Schema(
  {
    open: { type: String, required: true },  // "09:00"
    close: { type: String, required: true }, // "23:00"
  },
  { _id: false }
);

const restaurantSchema = new Schema(
  {
    name: { type: String, required: false, trim: false },
    description: { type: String, default: "" },
    cuisines: [{ type: String }], // ["Indian", "Chinese", "Italian"]
    image: { type: String, required: false },      // logo / thumbnail
    coverImage: { type: String, default: "" },     // wide banner
    address: { type: addressSchema, required: false },
    location: { type: locationSchema, required: false },
    phone: { type: Number, required: true, unique: true },
    email: { type: String },
    openHours: { type: openHoursSchema, required: false },

    deliveryFee: { type: Number, default: 0, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    avgDeliveryTimeMins: { type: Number, default: 30, min: 0 },
    priceForTwo: { type: Number, default: 0, min: 0 },

    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },

    tags: [{ type: String }], // ["Pure Veg", "Bestseller", "New on FoodWorld"]
    isVegOnly: { type: Boolean, default: false },

    owner: {
        type: String,
        default: "",  
        
    },

    isActive: { type: Boolean, default: false }, // admin can deactivate
    isOpen: { type: Boolean, default: false },   // partner can pause orders manually

    // --- Phone-OTP login (the restaurant listing IS the login account) ---
    role: { type: String, default: "restaurant" },
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    isPhoneVerified: { type: Boolean, default: false },
    tokens: [
      {
        token: { type: String, required: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: false }
);

restaurantSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id, role: "restaurant" },
    process.env.SECRET_KEY
  );
  this.tokens = this.tokens.concat({ token });
  return token;
};

restaurantSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return otp;
};

restaurantSchema.methods.verifyOTP = function (enteredOTP) {
  if (this.otp !== enteredOTP) return false;
  if (new Date() > this.otpExpiry) return false;
  return true;
};

restaurantSchema.methods.clearOTP = function () {
  this.otp = null;
  this.otpExpiry = null;
};

// Geospatial index for $near / $geoWithin queries
restaurantSchema.index({ location: "2dsphere" });

// Full-text index for global search
restaurantSchema.index({ name: "text", description: "text", cuisines: "text" });

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

export default Restaurant;

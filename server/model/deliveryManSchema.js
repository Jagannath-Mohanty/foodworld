import mongoose from "mongoose";

const { Schema } = mongoose;

const deliveryManSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, min: 0 },
    bloodGroup: { type: String, trim: true }, // e.g. "O+", "A-"
    address: { type: String, default: "" },
    vehicleNumber: { type: String, required: true, trim: true },
    vehicleName: { type: String, default: "" },
    drivingLicenceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // --- Phone-OTP login (the DeliveryMan record IS the login account) ---
    phone: { type: Number, required: true, unique: true },
    email: { type: String, default: "" },
    role: { type: String, default: "delivery" },
    isPhoneVerified: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: false }, // "online" — receives new-order pings
    tokens: [
      {
        token: { type: String, required: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // Last known position (GeoJSON Point [lng, lat]) for live tracking
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: undefined },
    },
  },
  { timestamps: true }
);

const DeliveryMan = mongoose.model("DeliveryMan", deliveryManSchema);

export default DeliveryMan;

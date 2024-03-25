import mongoose from "mongoose";

import { Schema } from "mongoose";

const orderSchema = new Schema({
  items: [
    {
      _id: { type: String, required: true },
      name: { type: String, required: true },
      image: { type: String, required: true },
      price: { type: Number, required: true },
      description: { type: String, required: true },
      category: { type: String, required: true },
    },
  ],
  totalAmount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", orderSchema);

export default Order;

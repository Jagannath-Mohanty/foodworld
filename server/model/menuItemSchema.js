import mongoose from "mongoose";

const { Schema } = mongoose;

const customizationOptionSchema = new Schema(
  {
    label: { type: String, required: true },     // "Extra cheese"
    priceDelta: { type: Number, default: 0 },     // +50
  },
  { _id: false }
);

const customizationGroupSchema = new Schema(
  {
    name: { type: String, required: true },        // "Size", "Add-ons"
    required: { type: Boolean, default: false },
    multiSelect: { type: Boolean, default: false }, // true = checkbox group, false = radio
    options: { type: [customizationOptionSchema], default: [] },
  },
  { _id: false }
);

const menuItemSchema = new Schema(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    image: { type: String, required: true },

    price: { type: Number, required: true, min: 0 },

    isVeg: { type: Boolean, default: true },
    spiceLevel: {
      type: String,
      enum: ["none", "mild", "medium", "hot", "extra-hot"],
      default: "none",
    },

    customizations: { type: [customizationGroupSchema], default: [] },

    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },

    tags: [{ type: String }],   // ["Bestseller", "Chef's Special"]
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Full-text index for global search
menuItemSchema.index({ name: "text", description: "text" });

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

export default MenuItem;

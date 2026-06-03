import mongoose from "mongoose";

const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true }, // "Starters", "Main Course"
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 }, // controls display order in the menu
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// A restaurant can't have two categories with the same name
categorySchema.index({ restaurantId: 1, name: 1 }, { unique: true });

const Category = mongoose.model("Category", categorySchema);

export default Category;

import mongoose from "mongoose";

const { Schema } = mongoose;

const productReviewSchema = new Schema({
  productId: {
    type: String,
    ref: "Product", // Reference to the Product model
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer", // Reference to the Customer model
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  review: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ProductReview = mongoose.model("ProductReview", productReviewSchema);

export default ProductReview;

/**
 * Mongoose equivalent of `prisma db push`.
 *
 * Connects to MongoDB, loads every model, and runs syncIndexes() on each —
 * which CREATES indexes defined in a schema and DROPS indexes that no longer
 * exist there. Run it after changing any schema's fields/indexes:
 *
 *     npm run db:push
 *
 * Note: Mongo is schemaless, so this only reconciles INDEXES, not document
 * shape. Existing documents are never rewritten (that's a data migration).
 */
import mongoose from "mongoose";
import { config } from "dotenv";

config({ path: "./config.env" });

// Importing the model files registers them on mongoose.models
import "../model/userSchema.js";
import "../model/customerSchema.js";
import "../model/restaurantSchema.js";
import "../model/menuItemSchema.js";
import "../model/Order.js";
import "../model/reviewSchema.js";
import "../model/couponSchema.js";
import "../model/productSchema.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/test";

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`Connected to ${MONGO_URI}`);

    const models = Object.values(mongoose.models);
    for (const model of models) {
      const dropped = await model.syncIndexes();
      console.log(
        `  ${model.modelName}: indexes synced` +
          (dropped.length ? ` (dropped: ${dropped.join(", ")})` : "")
      );
    }

    console.log("db:push complete.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("db:push failed:", err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

run();

import "dotenv/config";
import express, { json } from "express";
import http from "http";
import cors from "cors";
import mongoose from "mongoose";
import authRouter from "./router/auth.js";
import restaurantRouter from "./router/restaurant.js";
import paymentRouter from "./router/payment.js";
import deliveryRouter from "./router/delivery.js";
import couponRouter from "./router/coupon.js";
import adminRouter from "./router/admin.js";
import customerRouter from "./router/customer.js";
import restaurantPartnerRouter from "./router/restaurant_partner.js";
import otpRouter from "./router/otp.js";
import { initSocket } from "./socket.js";


const databaseUrl = process.env.MONGODB_URL || "mongodb://localhost:27017/test";
mongoose
  .connect(databaseUrl)
  .then(() => {
    console.log("connection successfull");
  })
  .catch((error) => {
    console.log(error);
  });

const app = express();

app.use(cors());
// Raised from the 100kb default so base64 image data URLs fit in JSON bodies.
app.use(json({ limit: "8mb" }));

app.use(authRouter);
// Also expose the auth endpoints under /api so every frontend can use a single
// /api base (e.g. /api/login, /api/register, /api/admin, /api/orders/*).
app.use("/api", authRouter);
app.use("/api",restaurantRouter);
app.use("/api",paymentRouter);
app.use("/api",deliveryRouter);
app.use("/api",couponRouter);
app.use("/api",adminRouter);
app.use("/api/customer", customerRouter);
app.use("/api/restaurant", restaurantPartnerRouter);
app.use("/api/otp", otpRouter);

const server = http.createServer(app);

initSocket(server);

server.listen(5000, () => {
  console.log("Server running successfull 5000 (http + socket.io)");
});

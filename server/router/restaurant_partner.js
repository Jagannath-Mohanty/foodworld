// @ts-check

import { Router } from "express";
import Restaurant from "../model/restaurantSchema.js";
import Category from "../model/categorySchema.js";
import MenuItem from "../model/menuItemSchema.js";
import Order, { ORDER_STATUSES } from "../model/Order.js";
import { emitOrderUpdate, emitToUser } from "../socket.js";
import { notifyAgentsOrderReady } from "./delivery.js";
// import { sendOrderStatusEmail } from "../lib/mailer.js";
import { generateAuthToken, generateOTP,sendOTPViaSMS } from "../util.js";
import Otp from "../model/otpSchema.js";
const router = Router();

// Mounted at /restaurant — partner-facing. Admin onboards the listing
// (POST /restaurants); the partner logs into it via phone OTP.

// TODO: integrate a real SMS gateway


// Statuses a restaurant partner is allowed to set on an order
// const RESTAURANT_SETTABLE = ["accepted", "preparing", "ready_for_pickup", "cancelled"];

// const notifyCustomerOfStatus = async (order) => {
//   try {
//     emitToUser(String(order.userId), "order:status", {
//       orderId: order._id,
//       status: order.status,
//     });
//     const customer = await Customer.findById(order.userId).select("email");
//     if (customer?.email) {
//       sendOrderStatusEmail({ to: customer.email, order, status: order.status }).catch(
//         () => {}
//       );
//     }
//   } catch (err) {
//     console.error("notifyCustomerOfStatus:", err.message);
//   }
// };

/* ============================================================
 * OTP auth (login by restaurant phone)
 * ============================================================ */

// POST /restaurant/auth/send-otp
router.post("/register", async (req, res) => {
   console.log("=============register",req.body);

  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "Phone number is required" });

  try {
    // Find-or-create the restaurant listing for this phone. The same endpoint
    // serves both first-time signup and "resend OTP" for an existing login.
    let restaurant = await Restaurant.findOne({ phone });
    if (!restaurant) {
      restaurant = new Restaurant({ phone });
      await restaurant.save();
    }

    const otp = await generateOTP(phone);
    await sendOTPViaSMS(phone, otp.otp);

    res.json({
      message: "OTP sent to the restaurant's phone",
      restaurant: { _id: restaurant._id, phone: restaurant.phone },
    });
  } catch (error) {
    console.log("Restaurant send-otp error:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// POST /restaurant/auth/verify-otp
router.post("/auth/verify-otp", async (req, res) => {

  console.log("=======================varify otp");
  
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: "Phone and OTP are required" });
  }

  try {
 const verifyOtp = await Otp.findOne({ phone: String(phone), otp: String(otp), isExpiry: false });
    if (!verifyOtp ) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }
    

    const restaurant = await Restaurant.findOne({ phone:phone });
    if (!restaurant) {
   console.log("Restaurant not found for phone:", phone);
      return res.status(404).json({ error: "Restaurant not found" });
    }
    verifyOtp.isExpiry = true;
    await verifyOtp.save();

    const token = generateAuthToken(restaurant);

    restaurant.isPhoneVerified = true;
    await restaurant.save();

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: "Login successful",
      token,
      restaurant: {
        _id: restaurant._id,
        name: restaurant.name,
        phone: restaurant.phone,
        isActive: restaurant.isActive,
        role: "restaurant",
      },
    });
  } catch (error) {
    console.log("Restaurant verify-otp error:", error);
    res.status(500).json({ error: "OTP verification failed" });
  }
});



/* ============================================================
 * Onboarding & activation (by restaurant _id, no auth)
 * ============================================================ */

// PUT /restaurant/onboard/:id — partner fills in their profile after OTP verification
router.patch("/onboard/:id", async (req, res) => {
  try {
    const editable = [
      "name", "description", "cuisines", "image", "coverImage", "address",
      "location", "email", "openHours", "deliveryFee", "minOrderAmount",
      "avgDeliveryTimeMins", "priceForTwo", "tags", "isVegOnly", "owner",
    ];

    /** @type {Record<string, any>} */
    const update = {};
    editable.forEach((field) => {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    });
    update.isActive = true; // listing goes live once onboarded

    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

    res.json({ message: "Restaurant onboarded", restaurant });
  } catch (error) {
    console.log("Restaurant onboard error:", error);
    res.status(400).json({ error: error.message });
  }
});

// GET /restaurant/:id/profile — fetch own listing (any status, unlike the public route)
router.get("/:id/profile", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
    res.json(restaurant);
  } catch (error) {
    console.log("Restaurant get profile error:", error);
    res.status(400).json({ error: error.message });
  }
});

// PATCH /restaurant/:id/profile — update editable details (does NOT change isActive)
router.patch("/:id/profile", async (req, res) => {
  try {
    const editable = [
      "name", "description", "cuisines", "image", "coverImage", "address",
      "location", "email", "openHours", "deliveryFee", "minOrderAmount",
      "avgDeliveryTimeMins", "priceForTwo", "tags", "isVegOnly", "owner",
    ];

    /** @type {Record<string, any>} */
    const update = {};
    editable.forEach((field) => {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    });

    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

    res.json({ message: "Profile updated", restaurant });
  } catch (error) {
    console.log("Restaurant update profile error:", error);
    res.status(400).json({ error: error.message });
  }
});

// PUT /restaurant/:id/active — activate / deactivate the listing
router.put("/:id/active", async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ error: "isActive (boolean) is required" });
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

    res.json({ _id: restaurant._id, isActive: restaurant.isActive });
  } catch (error) {
    console.log("Restaurant active toggle error:", error);
    res.status(400).json({ error: error.message });
  }
});

/* ============================================================
 * Categories (a restaurant's menu sections) — by restaurant _id, no auth
 * ============================================================ */

// POST /restaurant/:restaurantId/categories — create a category
router.post("/:restaurantId/categories", async (req, res) => {
  try {
    const { name, description, image, sortOrder } = req.body;
    if (!name) return res.status(400).json({ error: "Category name is required" });

    const category = await Category.create({
      restaurantId: req.params.restaurantId,
      name,
      description,
      image,
      sortOrder,
    });
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Category with this name already exists" });
    }
    console.log("Create category error:", error);
    res.status(400).json({ error: error.message });
  }
});

// GET /restaurant/:restaurantId/categories — list a restaurant's categories
router.get("/:restaurantId/categories", async (req, res) => {
  try {
    const categories = await Category.find({
      restaurantId: req.params.restaurantId,
    }).sort({ sortOrder: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    console.log("List categories error:", error);
    res.status(400).json({ error: error.message });
  }
});

// PUT /restaurant/categories/:categoryId — update a category
router.put("/categories/:categoryId", async (req, res) => {
  try {
    /** @type {Record<string, any>} */
    const update = {};
    ["name", "description", "image", "sortOrder", "isActive"].forEach((f) => {
      if (req.body[f] !== undefined) update[f] = req.body[f];
    });

    const category = await Category.findByIdAndUpdate(req.params.categoryId, update, {
      new: true,
      runValidators: true,
    });
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Category with this name already exists" });
    }
    console.log("Update category error:", error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /restaurant/categories/:categoryId — delete a category (only if empty)
router.delete("/categories/:categoryId", async (req, res) => {
  try {
    const itemCount = await MenuItem.countDocuments({
      categoryId: req.params.categoryId,
    });
    if (itemCount > 0) {
      return res.status(400).json({
        error: "Category has menu items. Remove them before deleting the category.",
      });
    }
    const category = await Category.findByIdAndDelete(req.params.categoryId);
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json({ message: "Category deleted" });
  } catch (error) {
    console.log("Delete category error:", error);
    res.status(400).json({ error: error.message });
  }
});

/* ============================================================
 * Menu items (created under a category)
 * ============================================================ */

// POST /restaurant/categories/:categoryId/menu — add a menu item under a category
router.post("/categories/:categoryId/menu", async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category) return res.status(404).json({ error: "Category not found" });

    const payload = {
      ...req.body,
      categoryId: category._id,
      restaurantId: category.restaurantId,
    };
    delete payload._id;
    const item = await MenuItem.create(payload);
    res.status(201).json(item);
  } catch (error) {
    console.log("Create menu item error:", error);
    res.status(400).json({ error: error.message });
  }
});

// GET /restaurant/categories/:categoryId/menu — list items in a category
router.get("/categories/:categoryId/menu", async (req, res) => {
  try {
    const items = await MenuItem.find({
      categoryId: req.params.categoryId,
    }).sort({ name: 1 });
    res.json(items);
  } catch (error) {
    console.log("List menu items error:", error);
    res.status(400).json({ error: error.message });
  }
});

// PUT /restaurant/menu-items/:id — update a menu item
router.put("/menu-items/:id", async (req, res) => {
  try {
    /** @type {Record<string, any>} */
    const update = {};
    ["name", "description", "image", "price", "isVeg", "available", "spiceLevel", "categoryId"].forEach(
      (f) => {
        if (req.body[f] !== undefined) update[f] = req.body[f];
      }
    );

    const item = await MenuItem.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ error: "Menu item not found" });
    res.json(item);
  } catch (error) {
    console.log("Update menu item error:", error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /restaurant/menu-items/:id — delete a menu item
router.delete("/menu-items/:id", async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Menu item not found" });
    res.json({ message: "Menu item deleted" });
  } catch (error) {
    console.log("Delete menu item error:", error);
    res.status(400).json({ error: error.message });
  }
});

/* ============================================================
 * Orders (partner-facing)
 * ============================================================ */

// Statuses a restaurant partner is allowed to set on an order
const RESTAURANT_SETTABLE = ["accepted", "preparing", "ready_for_pickup", "cancelled"];

// GET /restaurant/:id/orders — orders for this restaurant, newest first
router.get("/:id/orders", async (req, res) => {
  try {
    const orders = await Order.find({ restaurantId: req.params.id })
      .sort({ createdAt: -1 })
      .populate("customerId", "name phone")
      .limit(200);
    res.json(orders);
  } catch (error) {
    console.log("List restaurant orders error:", error);
    res.status(400).json({ error: error.message });
  }
});

// PATCH /restaurant/orders/:orderId/status — update an order's status
router.patch("/orders/:orderId/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    if (!RESTAURANT_SETTABLE.includes(status)) {
      return res.status(403).json({ error: "Restaurants cannot set this status" });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.transitionTo(status);
    await order.save();

    // Notify the customer (live order tracking + their inbox)
    emitOrderUpdate(String(order._id), { status: order.status });
    emitToUser(String(order.customerId), "order:status", {
      orderId: order._id,
      status: order.status,
    });
    // When the kitchen marks it ready, ping online delivery agents to pick it up.
    if (order.status === "ready_for_pickup") notifyAgentsOrderReady(order);

    res.json({ _id: order._id, status: order.status, timeline: order.timeline });
  } catch (error) {
    console.log("Update order status error:", error);
    res.status(400).json({ error: error.message });
  }
});

export default router;

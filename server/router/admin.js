import { Router } from "express";
import mongoose from "mongoose";
import Order from "../model/Order.js";
import Users from "../model/userSchema.js";
import Restaurant from "../model/restaurantSchema.js";
import MenuItem from "../model/menuItemSchema.js";
import DeliveryMan from "../model/deliveryManSchema.js";
import Authenticate_admin from "../middleware/authenticate_admin.js";
import { buildPagination, parsePagination } from "../util.js";

const router = Router();

/* ============================================================
 * Stats / analytics
 * ============================================================ */

// GET /admin/stats?days=30  — top-line numbers + daily series
router.get("/admin/stats", Authenticate_admin, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(parseInt(req.query.days) || 30, 365));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totals, byDay, byStatus, topRestaurants] = await Promise.all([
      // Top-line totals (excludes cancelled)
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$totalAmount" },
            totalDeliveryFees: { $sum: "$deliveryFee" },
            orders: { $sum: 1 },
            avgOrderValue: { $avg: "$totalAmount" },
          },
        },
      ]),
      // Daily series for the requested window
      Order.aggregate([
        { $match: { createdAt: { $gte: since }, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            sales: { $sum: "$totalAmount" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Status breakdown (current snapshot)
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      // Top restaurants by revenue
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" }, restaurantId: { $ne: null } } },
        {
          $group: {
            _id: "$restaurantId",
            sales: { $sum: "$totalAmount" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { sales: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "restaurants",
            localField: "_id",
            foreignField: "_id",
            as: "restaurant",
          },
        },
        { $unwind: { path: "$restaurant", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            sales: 1,
            orders: 1,
            name: "$restaurant.name",
            image: "$restaurant.image",
          },
        },
      ]),
    ]);

    const summary = totals[0] || {
      totalSales: 0,
      totalDeliveryFees: 0,
      orders: 0,
      avgOrderValue: 0,
    };

    // Platform's cut as a simple "profit" proxy (delivery fees + 15% commission)
    const profit = Math.round(summary.totalDeliveryFees + summary.totalSales * 0.15);

    // Counts by entity
    const [restaurantCount, userCount, deliveryAgentCount] = await Promise.all([
      Restaurant.countDocuments({ isActive: true }),
      Users.countDocuments({ role: { $in: ["user", null, undefined] } }),
      Users.countDocuments({ role: "delivery" }),
    ]);

    res.json({
      summary: {
        ...summary,
        profit,
        restaurantCount,
        userCount,
        deliveryAgentCount,
      },
      byDay,
      byStatus,
      topRestaurants,
      days,
    });
  } catch (err) {
    console.error("GET /admin/stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

/* ============================================================
 * User & role management
 * ============================================================ */

// POST /admin/users  body: { name, email, phone, password, role? }
router.post("/admin/users", async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(422).json({ error: "Please fill all the fields" });
    }
    if (!String(email).includes("@")) {
      return res.status(422).json({ error: "Please enter a valid email" });
    }
    if (String(phone).length !== 10) {
      return res.status(422).json({ error: "Please enter a valid phone number" });
    }

    const allowed = ["user", "restaurant", "delivery", "admin"];
    if (role && !allowed.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const userExist = await Users.findOne({ email });
    if (userExist) {
      return res.status(409).json({ error: "User already exists" });
    }

    const user = new Users({
      name,
      email,
      phone,
      password,
      ...(role ? { role } : {}),
    });
    await user.save();

    res.status(201).json({
      message: "User created successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("POST /admin/users:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// GET /admin/users?role=user|delivery|restaurant|admin&q=
router.get("/admin/users", Authenticate_admin, async (req, res) => {
  try {
    const { role, q } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: rx }, { email: rx }];
    }
    const { page, limit, skip } = parsePagination(req, { defaultLimit: 10, maxLimit: 50 });
    const [total, users] = await Promise.all([
      Users.countDocuments(filter),
      Users.find(filter)
        .select("name email phone role createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);
    res.json({ items: users, pagination: buildPagination(total, page, limit) });
  } catch (err) {
    console.error("GET /admin/users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// PUT /admin/users/:id/role  body: { token, role }
router.put("/admin/users/:id/role", Authenticate_admin, async (req, res) => {
  try {
    const { role } = req.body;
    const allowed = ["user", "restaurant", "delivery", "admin"];
    if (!allowed.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    const user = await Users.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("name email phone role");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("PUT /admin/users/:id/role:", err);
    res.status(500).json({ error: "Failed to update role" });
  }
});

// GET /admin/delivery-agents — agents + count of active deliveries
router.get("/admin/delivery-agents", Authenticate_admin, async (req, res) => {
  try {
    const filter = { role: "delivery" };
    const { page, limit, skip } = parsePagination(req, { defaultLimit: 12, maxLimit: 50 });
    const [total, agents] = await Promise.all([
      Users.countDocuments(filter),
      Users.find(filter)
        .select("name email phone createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const ids = agents.map((a) => a._id);
    const counts = await Order.aggregate([
      {
        $match: {
          deliveryAgentId: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) },
          status: "out_for_delivery",
        },
      },
      { $group: { _id: "$deliveryAgentId", active: { $sum: 1 } } },
    ]);
    const byAgent = new Map(counts.map((c) => [String(c._id), c.active]));

    const result = agents.map((a) => ({
      ...a,
      activeDeliveries: byAgent.get(String(a._id)) || 0,
    }));
    res.json({ items: result, pagination: buildPagination(total, page, limit) });
  } catch (err) {
    console.error("GET /admin/delivery-agents:", err);
    res.status(500).json({ error: "Failed to fetch delivery agents" });
  }
});

/* ============================================================
 * Delivery men (registry — name, vehicle, licence, etc.)
 * ============================================================ */

// GET /admin/delivery-men — list all delivery men
router.get("/admin/delivery-men", Authenticate_admin, async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req, { defaultLimit: 12, maxLimit: 50 });
    const [total, men] = await Promise.all([
      DeliveryMan.countDocuments({}),
      DeliveryMan.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);
    res.json({ items: men, pagination: buildPagination(total, page, limit) });
  } catch (err) {
    console.error("GET /admin/delivery-men:", err);
    res.status(500).json({ error: "Failed to fetch delivery men" });
  }
});

// POST /admin/delivery-men — create a delivery man
router.post("/admin/delivery-men", Authenticate_admin, async (req, res) => {
  try {
    const {
      name,
      phone,
      age,
      bloodGroup,
      address,
      vehicleNumber,
      vehicleName,
      drivingLicenceNumber,
    } = req.body;

    if (!name || !phone || !vehicleNumber || !drivingLicenceNumber) {
      return res.status(422).json({
        error: "Name, phone, vehicle number and driving licence number are required",
      });
    }

    const man = await DeliveryMan.create({
      name,
      phone,
      age,
      bloodGroup,
      address,
      vehicleNumber,
      vehicleName,
      drivingLicenceNumber,
    });
    res.status(201).json(man);
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ error: "A delivery man with this driving licence already exists" });
    }
    console.error("POST /admin/delivery-men:", err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /admin/delivery-men/:id — remove a delivery man
router.delete("/admin/delivery-men/:id", Authenticate_admin, async (req, res) => {
  try {
    const man = await DeliveryMan.findByIdAndDelete(req.params.id);
    if (!man) return res.status(404).json({ error: "Delivery man not found" });
    res.json({ message: "Delivery man removed" });
  } catch (err) {
    console.error("DELETE /admin/delivery-men/:id:", err);
    res.status(400).json({ error: err.message });
  }
});

export default router;

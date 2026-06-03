import { Router } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import Restaurant from "../model/restaurantSchema.js";
import MenuItem from "../model/menuItemSchema.js";
import Category from "../model/categorySchema.js";
import Review from "../model/reviewSchema.js";
import Order from "../model/Order.js";
import Customer from "../model/customerSchema.js";
import Authenticate_admin from "../middleware/authenticate_admin.js";
import { buildPagination, parsePagination } from "../util.js";

const router = Router();

/* ============================================================
 * Public — Global search (restaurants + dishes)
 * ============================================================ */

// GET /search?q=...&limit=5
router.get("/search", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const limit = Math.min(parseInt(req.query.limit) || 5, 20);

    if (!q) {
      return res.json({ restaurants: [], dishes: [] });
    }

    // Text search first; fall back to regex if no matches (handles partial words)
    const buildRegex = () => new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const [restaurantsByText, dishesByText] = await Promise.all([
      Restaurant.find(
        { $text: { $search: q }, isActive: true },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(limit),
      MenuItem.find(
        { $text: { $search: q }, available: true },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(limit)
        .populate("restaurantId", "name image"),
    ]);

    let restaurants = restaurantsByText;
    let dishes = dishesByText;

    if (restaurants.length === 0) {
      const rx = buildRegex();
      restaurants = await Restaurant.find({
        isActive: true,
        $or: [{ name: rx }, { cuisines: rx }],
      }).limit(limit);
    }
    if (dishes.length === 0) {
      const rx = buildRegex();
      dishes = await MenuItem.find({
        available: true,
        $or: [{ name: rx }, { description: rx }, { category: rx }],
      })
        .limit(limit)
        .populate("restaurantId", "name image");
    }

    res.json({ restaurants, dishes });
  } catch (err) {
    console.error("GET /search:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

/* ============================================================
 * Public — Item search / listing (powers the customer Search page)
 * ============================================================
 * GET /items?q=...
 *   - no q              -> all available items (from active restaurants)
 *   - q matches a restaurant name/cuisine -> that restaurant's whole menu
 *   - else q matches a category name      -> items in those categories (all restaurants)
 *   - else                                -> items whose name/description match q
 * Response: { query, mode, restaurants, categories, items }
 *   categories = distinct categories of the returned items (the "category section")
 *   items      = the menu items (the "menu section"), populated with category + restaurant
 */
router.get("/items", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = q ? new RegExp(escape(q), "i") : null;

    let mode = "all";
    let restaurants = [];
    const itemFilter = { available: true };

    if (rx) {
      // 1) restaurant-name / cuisine match -> scope to those restaurants
      restaurants = await Restaurant.find({
        isActive: true,
        $or: [{ name: rx }, { cuisines: rx }],
      }).select("name image cuisines");

      if (restaurants.length) {
        mode = "restaurant";
        itemFilter.restaurantId = { $in: restaurants.map((r) => r._id) };
      } else {
        // 2) category-name match -> items in those categories
        const cats = await Category.find({ name: rx, isActive: true }).select("_id");
        if (cats.length) {
          mode = "category";
          itemFilter.categoryId = { $in: cats.map((c) => c._id) };
        } else {
          // 3) item-name / description match
          mode = "item";
          itemFilter.$or = [{ name: rx }, { description: rx }];
        }
      }
    }

    const { page, limit, skip } = parsePagination(req, { defaultLimit: 12, maxLimit: 50 });
    const totalFilter = { ...itemFilter };
    const [total, items] = await Promise.all([
      MenuItem.countDocuments(totalFilter),
      MenuItem.find(itemFilter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .populate("categoryId", "name")
        // match: only items from active restaurants survive (others get null and are dropped)
        .populate({ path: "restaurantId", select: "name image", match: { isActive: true } }),
    ]);

    const visibleItems = items.filter((it) => it.restaurantId);

    // Build the category section from the items actually shown.
    const catMap = new Map();
    for (const it of visibleItems) {
      if (it.categoryId?._id) {
        const key = String(it.categoryId._id);
        if (!catMap.has(key)) {
          catMap.set(key, {
            _id: it.categoryId._id,
            name: it.categoryId.name,
            restaurantId: it.restaurantId?._id,
            restaurantName: it.restaurantId?.name,
          });
        }
      }
    }

    res.json({
      query: q,
      mode: visibleItems.length ? mode : q ? "none" : "all",
      restaurants,
      categories: Array.from(catMap.values()),
      items: visibleItems,
      pagination: buildPagination(total, page, limit),
    });
  } catch (err) {
    console.error("GET /items:", err);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

/* ============================================================
 * Public — Restaurants
 * ============================================================ */

// GET /restaurants — list active restaurants, optional ?cuisine=&q=&isVegOnly=&lat=&lng=&radius=
router.get("/restaurants", async (req, res) => {
  try {
    const { cuisine, q, isVegOnly, lat, lng, radius } = req.query;
    const filter = { isActive: true };

    if (cuisine) filter.cuisines = { $in: cuisine.split(",") };
    if (isVegOnly === "true") filter.isVegOnly = true;
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { cuisines: { $regex: q, $options: "i" } },
      ];
    }

    // Geo-near filter: $near sorts by distance automatically
    if (lat && lng) {
      const radiusKm = Math.max(0.5, Math.min(parseFloat(radius) || 5, 50));
      filter.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: radiusKm * 1000, // meters
        },
      };
      // $near already sorts by distance — no extra sort needed
      const { page, limit, skip } = parsePagination(req, { defaultLimit: 12, maxLimit: 50 });
      const [total, restaurants] = await Promise.all([
        Restaurant.countDocuments(filter),
        Restaurant.find(filter).skip(skip).limit(limit),
      ]);
      return res.json({ items: restaurants, pagination: buildPagination(total, page, limit) });
    }

    const { page, limit, skip } = parsePagination(req, { defaultLimit: 12, maxLimit: 50 });
    const [total, restaurants] = await Promise.all([
      Restaurant.countDocuments(filter),
      Restaurant.find(filter)
        .sort({
          "rating.average": -1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit),
    ]);
    res.json({ items: restaurants, pagination: buildPagination(total, page, limit) });
  } catch (err) {
    console.error("GET /restaurants:", err);
    res.status(500).json({ error: "Failed to fetch restaurants" });
  }
});

// GET /restaurants/:id — one restaurant
router.get("/restaurants/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant || !restaurant.isActive) {
      return res.status(404).json({ error: "Restaurant not found" });
    }
    res.json(restaurant);
  } catch (err) {
    console.error("GET /restaurants/:id:", err);
    res.status(500).json({ error: "Failed to fetch restaurant" });
  }
});

// GET /restaurants/:id/menu — menu items grouped by category
router.get("/restaurants/:id/menu", async (req, res) => {
  try {
    const filter = {
      restaurantId: req.params.id,
      available: true,
    };
    const { page, limit, skip } = parsePagination(req, { defaultLimit: 12, maxLimit: 50 });
    const [total, items] = await Promise.all([
      MenuItem.countDocuments(filter),
      MenuItem.find(filter).sort({ category: 1, name: 1 }).skip(skip).limit(limit),
    ]);

    const grouped = items.reduce((acc, item) => {
      (acc[item.category] = acc[item.category] || []).push(item);
      return acc;
    }, {});

    res.json({ items, grouped, pagination: buildPagination(total, page, limit) });
  } catch (err) {
    console.error("GET /restaurants/:id/menu:", err);
    res.status(500).json({ error: "Failed to fetch menu" });
  }
});

/* ============================================================
 * Admin — Restaurants CRUD
 * ============================================================ */

// POST /restaurants — create
router.post("/restaurants", Authenticate_admin, async (req, res) => {
  try {
    const { token, ...payload } = req.body;
    const restaurant = await Restaurant.create(payload);
    res.status(201).json(restaurant);
  } catch (err) {
    console.error("POST /restaurants:", err);
    res.status(400).json({ error: err.message });
  }
});

// PUT /restaurants/:id — update
router.put("/restaurants/:id", Authenticate_admin, async (req, res) => {
  try {
    const { token, ...payload } = req.body;
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );
    if (!restaurant) return res.status(404).json({ error: "Not found" });
    res.json(restaurant);
  } catch (err) {
    console.error("PUT /restaurants/:id:", err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /restaurants/:id — soft-delete (set isActive=false)
router.delete("/restaurants/:id", Authenticate_admin, async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!restaurant) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Restaurant deactivated", restaurant });
  } catch (err) {
    console.error("DELETE /restaurants/:id:", err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

/* ============================================================
 * Admin — Menu Items CRUD
 * ============================================================ */

// POST /restaurants/:id/menu — add a menu item to a restaurant
router.post("/restaurants/:id/menu", Authenticate_admin, async (req, res) => {
  try {
    const { token, ...payload } = req.body;
    const item = await MenuItem.create({
      ...payload,
      restaurantId: req.params.id,
    });
    res.status(201).json(item);
  } catch (err) {
    console.error("POST /restaurants/:id/menu:", err);
    res.status(400).json({ error: err.message });
  }
});

// PUT /menu-items/:id — update
router.put("/menu-items/:id", Authenticate_admin, async (req, res) => {
  try {
    const { token, ...payload } = req.body;
    const item = await MenuItem.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    console.error("PUT /menu-items/:id:", err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /menu-items/:id
router.delete("/menu-items/:id", Authenticate_admin, async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Menu item deleted" });
  } catch (err) {
    console.error("DELETE /menu-items/:id:", err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

/* ============================================================
 * Reviews
 * ============================================================ */

const userFromToken = async (token) => {
  if (!token) return null;
  const cleaned = token.replace(/"/g, "");
  const verified = jwt.verify(cleaned, process.env.SECRET_KEY);
  return Customer.findOne({ _id: verified._id, "tokens.token": cleaned });
};

// Recompute average and count on restaurant after a new review
const refreshRestaurantRating = async (restaurantId) => {
  const agg = await Review.aggregate([
    { $match: { restaurantId: new mongoose.Types.ObjectId(String(restaurantId)) } },
    { $group: { _id: "$restaurantId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const result = agg[0] || { avg: 0, count: 0 };
  await Restaurant.findByIdAndUpdate(restaurantId, {
    "rating.average": Math.round(result.avg * 10) / 10,
    "rating.count": result.count,
  });
};

// GET /restaurants/:id/reviews
router.get("/restaurants/:id/reviews", async (req, res) => {
  try {
    const filter = { restaurantId: req.params.id };
    const { page, limit, skip } = parsePagination(req, { defaultLimit: 10, maxLimit: 50 });
    const [total, reviews] = await Promise.all([
      Review.countDocuments(filter),
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name"),
    ]);
    res.json({ items: reviews, pagination: buildPagination(total, page, limit) });
  } catch (err) {
    console.error("GET /restaurants/:id/reviews:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// POST /restaurants/:id/reviews — review your own delivered order
router.post("/restaurants/:id/reviews", async (req, res) => {
  try {
    const { token, orderId, rating, comment } = req.body;
    const user = await userFromToken(token);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (!orderId || !rating) {
      return res.status(400).json({ error: "orderId and rating are required" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (String(order.customerId) !== String(user._id)) {
      return res.status(403).json({ error: "Not your order" });
    }
    if (order.status !== "delivered") {
      return res.status(400).json({ error: "Order is not delivered yet" });
    }
    if (String(order.restaurantId) !== String(req.params.id)) {
      return res.status(400).json({ error: "Order does not match restaurant" });
    }

    const review = await Review.create({
      userId: user._id,
      restaurantId: req.params.id,
      orderId,
      rating,
      comment: comment || "",
    }).catch((err) => {
      if (err.code === 11000) throw new Error("Already reviewed this order");
      throw err;
    });

    order.ratedAt = new Date();
    await order.save();

    await refreshRestaurantRating(req.params.id);

    res.status(201).json(review);
  } catch (err) {
    console.error("POST /restaurants/:id/reviews:", err);
    res.status(400).json({ error: err.message });
  }
});

export default router;

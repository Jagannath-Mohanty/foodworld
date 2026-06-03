import jwt from "jsonwebtoken";
import Restaurant from "../model/restaurantSchema.js";

/**
 * Verifies a restaurant's JWT (Authorization header or body/query token) and
 * that the matching restaurant exists. Attaches req.restaurant.
 */
const AuthenticateRestaurant = async (req, res, next) => {
  try {
    const raw =
      req.headers.authorization?.replace(/^Bearer\s+/i, "") ||
      req.body?.token ||
      req.query?.token;
    if (!raw) return res.status(401).json({ error: "Token is required" });

    const cleaned = raw.replace(/"/g, "");
    const verified = jwt.verify(cleaned, process.env.SECRET_KEY);

    const restaurant = await Restaurant.findOne({
      _id: verified._id,
      "tokens.token": cleaned,
    });
    if (!restaurant) {
      return res.status(401).json({ error: "Restaurant not found or token invalid" });
    }

    req.token = cleaned;
    req.restaurant = restaurant;
    req.restaurantId = restaurant._id;
    next();
  } catch (err) {
    console.error("AuthenticateRestaurant:", err.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

export default AuthenticateRestaurant;

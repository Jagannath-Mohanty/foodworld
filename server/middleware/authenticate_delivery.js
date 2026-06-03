import jwt from "jsonwebtoken";
import Users from "../model/userSchema.js";

/**
 * Verifies the JWT (token from Authorization header or body) AND that the
 * user has role "delivery". Attaches req.user.
 */
const Authenticate_Delivery = async (req, res, next) => {
  try {
    const raw =
      req.headers.authorization?.replace(/^Bearer\s+/i, "") ||
      req.body?.token ||
      req.query?.token;
    if (!raw) return res.status(401).json({ error: "Missing token" });

    const cleaned = raw.replace(/"/g, "");
    const verified = jwt.verify(cleaned, process.env.SECRET_KEY);

    const user = await Users.findOne({
      _id: verified._id,
      "tokens.token": cleaned,
    });
    if (!user) return res.status(401).json({ error: "User not found" });

    if (user.role !== "delivery") {
      return res.status(403).json({ error: "Delivery agents only" });
    }

    req.token = cleaned;
    req.user = user;
    req.userID = user._id;
    next();
  } catch (err) {
    console.error("Authenticate_Delivery:", err.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

export default Authenticate_Delivery;

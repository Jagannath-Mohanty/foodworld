import jwt from "jsonwebtoken";
import DeliveryMan from "../model/deliveryManSchema.js";

/**
 * Verifies a delivery man's stateless JWT (Bearer header or body/query `token`)
 * and loads the DeliveryMan by `id`. Attaches req.agent.
 */
const Authenticate_DeliveryMan = async (req, res, next) => {
  try {
    const raw =
      req.headers.authorization?.replace(/^Bearer\s+/i, "") ||
      req.body?.token ||
      req.query?.token;
    if (!raw) return res.status(401).json({ error: "Missing token" });

    const cleaned = raw.replace(/"/g, "");
    const verified = jwt.verify(cleaned, process.env.SECRET_KEY);

    const agent = await DeliveryMan.findById(verified.id || verified._id);
    if (!agent) return res.status(401).json({ error: "Delivery agent not found" });

    req.token = cleaned;
    req.agent = agent;
    next();
  } catch (err) {
    console.error("Authenticate_DeliveryMan:", err.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

export default Authenticate_DeliveryMan;

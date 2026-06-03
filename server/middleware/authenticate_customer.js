import jwt from "jsonwebtoken";
import Customer from "../model/customerSchema.js";

const AuthenticateCustomer = async (req, res, next) => {
  try {
    // Get token from Authorization header or request body
    const token = req.headers.authorization?.split(" ")[1] || req.body.token;

    if (!token) {
      return res.status(401).json({ error: "Token is required" });
    }

    console.log("Verifying customer token");
    const newTok = token.replace(/"/g, "");
    const verifyToken = jwt.verify(newTok, process.env.SECRET_KEY);

    const customer = await Customer.findOne({
      _id: verifyToken._id,
      "tokens.token": newTok,
    });

    if (!customer) {
      return res.status(401).json({ error: "Customer not found or token invalid" });
    }

    req.token = newTok;
    req.customer = customer;
    req.customerId = customer._id;
    req.role = customer.role;

    console.log("Customer authenticated:", req.customerId);
    next();
  } catch (error) {
    console.log("Error from AuthenticateCustomer:", error.message);
    res.status(401).json({ error: "Unauthorized" });
  }
};

export default AuthenticateCustomer;

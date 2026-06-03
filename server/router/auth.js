import { Router } from "express";
import Users from "../model/userSchema.js";
import Customer from "../model/customerSchema.js";
import Authenticate_admin from "../middleware/authenticate_admin.js";
import bcrypt from "bcryptjs";
import MakeAdmin from "../middleware/make_admin.js";
import jwt from "jsonwebtoken";
import ProductReview from "../model/productSchema.js";
import Order from "../model/Order.js";
import { generateAuthToken } from "../util.js";
const router = Router();
// const { compare } = pkg;
router.get("/", (req, res) => {
  res.send("Hello from Router");
});
router.post("/register", async (req, res) => {
  const { name, email, phone, password, cpassword } = req.body;

  if (!name || !email || !phone || !password || !cpassword) {
    // window.alert("Please Fill all the Field");
    return res.status(422).json({ error: "Please Fill all the Field" });
  }
  try {
    if (email.includes("@") == false) {
      return res.status(422).json({ error: "Please enter a valid Mail" });
    } else if (phone.toString().length != 10) {
      return res
        .status(422)
        .json({ error: "Please enter a valid phone number" });
    }
    const userExist = await Users.findOne({ email: email });

    if (userExist) {
      return res.status(500).json({ error: "User Already Exists" });
    } else if (password != cpassword) {
      return res.status(500).json({ error: "Password are not same" });
    } else {
      const user = new Users({
        name,
        email,
        phone,
        password,
      });

      await user.save();
      res.status(201).json({ message: "User Registration Successful" });
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/login", async (req, res) => {
  console.log("============%%%%%%%%%%====>", req.body);
  try {
    let token;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Please Fill all the Field" });
    }
    const userLogin = await Users.findOne({ email: email });
    console.log("=============userLogin===============");
    console.log(userLogin);
    console.log("=============userLogin===============");

    if (userLogin) {
      const isMatch = await bcrypt.compare(password, userLogin.password);

      token = await generateAuthToken(userLogin);
      console.log("====================Token==================");
      console.log(token);
      console.log("====================Token==================");

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      if (!isMatch) {
        res.status(400).json({ error: "Invalid password" });
      } else {
        res.json({ message: "Signin Successfull", token: token });
      }
    } else {
      res.status(400).json({ error: "Invalid email " });
    }
  } catch (err) {
    console.log(err);
  }
});

router.post("/admin", Authenticate_admin, (req, res) => {
  console.log("hello from admin");
  res.send(req.allUsers);
});

router.post("/make-admin", MakeAdmin, (req, res) => {
  console.log("====>", req.body);
  res.send(req.allUsers);
});

router.post("/rating", async (req, res) => {
  console.log("=============>console from cart back");
  console.log(req.body);
  const token = req.body.token;
  const rating = req.body.rating;
  const review = req.body.review;
  const productId = req.body._id;

  let newTok = token.replace(/"/g, "");
  console.log("Modified Token:", newTok);
  const verifiedToken = jwt.verify(newTok, process.env.SECRET_KEY);
  console.log("Verified Token:", verifiedToken);

  try {
    const rootUser = await Customer.findOne({
      _id: verifiedToken._id,
      "tokens.token": newTok,
    });

    const productReview = new ProductReview({
      productId: productId,
      userId: rootUser._id,
      rating: rating,
      review: review,
    });

    await productReview.save();

    res.status(201).send("Review submitted successfully");
  } catch (error) {
    console.error("Error saving review:", error);
    res.status(500).send("Error saving review");
  }
});

/* ---- Authenticated reads for the logged-in user ---- */

const findUserByToken = async (token) => {
  if (!token) return null;
  const cleaned = token.replace(/"/g, "");
  const verified = jwt.verify(cleaned, process.env.SECRET_KEY);
  return Users.findById(verified.id || verified._id);
};

router.get("/orders/me", async (req, res) => {
  try {
    const token =
      req.headers.authorization?.replace(/^Bearer\s+/i, "") || req.query.token;
    const user = await findUserByToken(token);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const orders = await Order.find({ customerId: user._id })
      .sort({ createdAt: -1 })
      .populate("restaurantId", "name image");
    res.json(orders);
  } catch (err) {
    console.error("GET /orders/me:", err);
    res.status(401).json({ error: "Unauthorized" });
  }
});

router.get("/orders/:id", async (req, res) => {
  try {
    const token =
      req.headers.authorization?.replace(/^Bearer\s+/i, "") || req.query.token;
    const user = await findUserByToken(token);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const order = await Order.findById(req.params.id)
      .populate("restaurantId", "name image phone address")
      .populate("deliveryAgentId", "name phone");

    if (!order) return res.status(404).json({ error: "Order not found" });
    // user may view their own order; admin/delivery checks come in Phase 5
    if (
      String(order.customerId) !== String(user._id) &&
      user.role !== "admin"
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(order);
  } catch (err) {
    console.error("GET /orders/:id:", err);
    res.status(401).json({ error: "Unauthorized" });
  }
});

export default router;

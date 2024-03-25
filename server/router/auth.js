import { Router } from "express";
import Customers from "../model/userSchema.js";
import Authenticate from "../middleware/authenticate.js";
import Authenticate_admin from "../middleware/authenticate_admin.js";
import bcrypt from "bcryptjs";
import MakeAdmin from "../middleware/make_admin.js";
import jwt from "jsonwebtoken";
import ProductReview from "../model/productSchema.js";
import Order from "../model/Order.js";

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
    const userExist = await Customers.findOne({ email: email });

    if (email.includes("@gmail.com") == false) {
      // return res.status(500).json({ error: "Please enter a valid email" });
      window.alert("Please enter a valid email");
    } else if (userExist) {
      return res.status(500).json({ error: "Customers Already   Exist...." });
    } else if (password != cpassword) {
      return res.status(500).json({ error: "Password are not same" });
    } else {
      const user = new Customers({
        name,
        email,
        phone,
        password,
      });

      await user.save();
      res.status(201).json({ message: "Customers Registration Successfull" });
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
    const userLogin = await Customers.findOne({ email: email });

    if (userLogin) {
      const isMatch = await bcrypt.compare(password, userLogin.password);

      token = await userLogin.generateAuthToken();

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
  const { user_id } = req.body;
  console.log("====>", req.body);
});

router.post("/rating", async (req, res) => {
  console.log("=============>console from cart back");
  console.log(req.body);
  const token = req.body.token;
  const rating = req.body.rating;
  const review = req.body.review;
  const productId = req.body._id;
  const productName = req.body.name;

  let newTok = token.replace(/"/g, "");
  console.log("Modified Token:", newTok);
  const verifiedToken = jwt.verify(newTok, process.env.SECRET_KEY);
  console.log("Verified Token:", verifiedToken);

  try {
    const rootUser = await Customers.findOne({
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

router.post("/placeorder", async (req, res) => {
  try {
    const { token, orderData } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const newToken = token.replace(/"/g, "");
    const verifiedToken = jwt.verify(newToken, process.env.SECRET_KEY);

    const customer = await Customers.findOne({
      _id: verifiedToken._id,
      "tokens.token": newToken,
    });

    if (!customer) {
      return res
        .status(404)
        .json({ message: "Customer not found or unauthorized" });
    }

    const { items, totalAmount } = orderData;

    customer.orders = customer.orders || [];

    const newOrder = new Order({
      items: items,
      totalAmount: totalAmount,
      createdAt: new Date(),
    });

    console.log(newOrder);

    customer.orders.push(newOrder);

    await customer.save();

    res.status(201).send("Order placed successfully");
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).send("Error placing order");
  }
});

export default router;

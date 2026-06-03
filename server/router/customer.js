// @ts-check


import { Router } from "express";
import Customer from "../model/customerSchema.js";
import Users from "../model/userSchema.js";
import Order from "../model/Order.js";
import Coupon from "../model/couponSchema.js";
import Restaurant from "../model/restaurantSchema.js";
import jwt from "jsonwebtoken";
import { sendOrderPlacedEmail } from "../lib/mailer.js";
import { emitToUser, emitToRestaurant } from "../socket.js";
import { config } from "dotenv";
import { generateOTP, sendOTPViaSMS } from "../util.js";
config({ path: "./config.env" });
const router = Router();

const SECRET_KEY = process.env.SECRET_KEY
// POST /customer/register — create account + send OTP
router.post("/register", async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(422).json({ error: "Please enter a phone number" });
  }

  try {
    if (phone.toString().length !== 10) {
      return res
        .status(422)
        .json({ error: "Please enter a valid phone number" });
    }

    const customerExists = await Customer.findOne({ phone });

    // Already registered and verified → block re-registration
    if (customerExists && customerExists.isPhoneVerified) {
      return res.status(409).json({ error: "Customer already exists" });
    }

    // Registered but never verified → just resend a fresh OTP
    if (customerExists && !customerExists.isPhoneVerified) {
      const otp = await generateOTP();
      await customerExists.save();
      await sendOTPViaSMS(phone, otp);
      return res.status(200).json({
        message: "OTP resent. Please verify your phone.",
        customerId: customerExists._id,
      });
    }

    const customer = new Customer({ phone });
    const otp = await generateOTP(phone);
    console.log("================>", otp);

    await customer.save();
    await sendOTPViaSMS(phone, otp);

    res.status(201).json({
      message: "Customer registered. OTP sent to your phone.",
      customerId: customer._id,
    });
  } catch (error) {
    console.log("Register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /customer/login — request OTP for an existing customer
router.post("/login", async (req, res) => {
  const { phone } = req.body;
  if (!phone)
    return res.status(400).json({ error: "Phone number is required" });

  try {
    const customer = await Customer.findOne({ phone });
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const otp = await generateOTP();
    await customer.save();
    await sendOTPViaSMS(phone, otp);

    res.json({ message: "OTP sent to your phone" });
  } catch (error) {
    console.log("Login error:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});



/* ============================================================
 * Profile
 * ============================================================ */

// // GET /customer/profile
// router.get("/profile", AuthenticateCustomer, async (req, res) => {
//   const c = req.customer;
//   res.json({
//     customer: {
//       _id: c._id,
//       name: c.name,
//       email: c.email,
//       phone: c.phone,
//       role: c.role,
//       isPhoneVerified: c.isPhoneVerified,
//       addresses: c.addresses,
//       favorites: c.favorites,
//       createdAt: c.createdAt,
//     },
//   });
// });

// // PUT /customer/profile — update name/email only (phone is the login key)
// router.put("/profile", AuthenticateCustomer, async (req, res) => {
//   try {
//     const { name, email } = req.body;
//     if (email && !email.includes("@")) {
//       return res.status(422).json({ error: "Please enter a valid email" });
//     }
//     if (name) req.customer.name = name;
//     if (email) req.customer.email = email;
//     await req.customer.save();
//     res.json({
//       message: "Profile updated",
//       customer: { name: req.customer.name, email: req.customer.email },
//     });
//   } catch (error) {
//     console.log("Profile update error:", error);
//     res.status(500).json({ error: "Failed to update profile" });
//   }
// });

// /* ============================================================
//  * Addresses
//  * ============================================================ */

// // GET /customer/addresses
// router.get("/addresses", AuthenticateCustomer, (req, res) => {
//   res.json(req.customer.addresses);
// });

// // POST /customer/addresses
// router.post("/addresses", AuthenticateCustomer, async (req, res) => {
//   try {
//     const { label, line1, line2, city, pincode, location, isDefault } =
//       req.body;
//     if (!line1) return res.status(422).json({ error: "line1 is required" });

//     const customer = req.customer;
//     const makeDefault = isDefault || customer.addresses.length === 0;
//     if (makeDefault) customer.addresses.forEach((a) => (a.isDefault = false));

//     customer.addresses.push({
//       label,
//       line1,
//       line2,
//       city,
//       pincode,
//       location,
//       isDefault: makeDefault,
//     });
//     await customer.save();
//     res.status(201).json(customer.addresses);
//   } catch (error) {
//     console.log("Add address error:", error);
//     res.status(400).json({ error: error.message });
//   }
// });

// // PUT /customer/addresses/:addressId
// router.put("/addresses/:addressId", AuthenticateCustomer, async (req, res) => {
//   try {
//     const customer = req.customer;
//     const address = customer.addresses.id(req.params.addressId);
//     if (!address) return res.status(404).json({ error: "Address not found" });

//     const { label, line1, line2, city, pincode, location, isDefault } =
//       req.body;
//     if (label !== undefined) address.label = label;
//     if (line1 !== undefined) address.line1 = line1;
//     if (line2 !== undefined) address.line2 = line2;
//     if (city !== undefined) address.city = city;
//     if (pincode !== undefined) address.pincode = pincode;
//     if (location !== undefined) address.location = location;
//     if (isDefault === true) {
//       customer.addresses.forEach((a) => (a.isDefault = false));
//       address.isDefault = true;
//     }

//     await customer.save();
//     res.json(customer.addresses);
//   } catch (error) {
//     console.log("Update address error:", error);
//     res.status(400).json({ error: error.message });
//   }
// });

// // DELETE /customer/addresses/:addressId
// router.delete(
//   "/addresses/:addressId",
//   AuthenticateCustomer,
//   async (req, res) => {
//     try {
//       const customer = req.customer;
//       const address = customer.addresses.id(req.params.addressId);
//       if (!address) return res.status(404).json({ error: "Address not found" });

//       const wasDefault = address.isDefault;
//       address.deleteOne();
//       if (wasDefault && customer.addresses.length > 0) {
//         customer.addresses[0].isDefault = true;
//       }
//       await customer.save();
//       res.json(customer.addresses);
//     } catch (error) {
//       console.log("Delete address error:", error);
//       res.status(500).json({ error: "Failed to delete address" });
//     }
//   },
// );

// /* ============================================================
//  * Favorites
//  * ============================================================ */

// // GET /customer/favorites — populated restaurants
// router.get("/favorites", AuthenticateCustomer, async (req, res) => {
//   try {
//     const customer = await Customer.findById(req.customerId).populate(
//       "favorites",
//       "name image cuisines rating deliveryFee avgDeliveryTimeMins isOpen",
//     );
//     res.json(customer.favorites);
//   } catch (error) {
//     console.log("Get favorites error:", error);
//     res.status(500).json({ error: "Failed to fetch favorites" });
//   }
// });

// // POST /customer/favorites/:restaurantId
// router.post(
//   "/favorites/:restaurantId",
//   AuthenticateCustomer,
//   async (req, res) => {
//     try {
//       const restaurant = await Restaurant.findById(req.params.restaurantId);
//       if (!restaurant)
//         return res.status(404).json({ error: "Restaurant not found" });

//       const customer = req.customer;
//       if (
//         !customer.favorites.some((id) => String(id) === String(restaurant._id))
//       ) {
//         customer.favorites.push(restaurant._id);
//         await customer.save();
//       }
//       res.json({
//         message: "Added to favorites",
//         favorites: customer.favorites,
//       });
//     } catch (error) {
//       console.log("Add favorite error:", error);
//       res.status(400).json({ error: error.message });
//     }
//   },
// );

// // DELETE /customer/favorites/:restaurantId
// router.delete(
//   "/favorites/:restaurantId",
//   AuthenticateCustomer,
//   async (req, res) => {
//     try {
//       const customer = req.customer;
//       customer.favorites = customer.favorites.filter(
//         (id) => String(id) !== String(req.params.restaurantId),
//       );
//       await customer.save();
//       res.json({
//         message: "Removed from favorites",
//         favorites: customer.favorites,
//       });
//     } catch (error) {
//       console.log("Remove favorite error:", error);
//       res.status(500).json({ error: "Failed to remove favorite" });
//     }
//   },
// );

// /* ============================================================
//  * Logout
//  * ============================================================ */

// // POST /customer/logout — clear current token
// router.post("/logout", AuthenticateCustomer, async (req, res) => {
//   try {
//     req.customer.tokens = req.customer.tokens.filter(
//       (t) => t.token !== req.token,
//     );
//     await req.customer.save();
//     res.json({ message: "Logout successful" });
//   } catch (error) {
//     console.log("Logout error:", error);
//     res.status(500).json({ error: "Logout failed" });
//   }
// });

// // POST /customer/logout-all — clear all tokens
// router.post("/logout-all", AuthenticateCustomer, async (req, res) => {
//   try {
//     req.customer.tokens = [];
//     await req.customer.save();
//     res.json({ message: "Logged out from all devices" });
//   } catch (error) {
//     console.log("Logout all error:", error);
//     res.status(500).json({ error: "Logout failed" });
//   }
// });

// POST /customer/placeorder — place an order for the authenticated customer
router.post("/placeorder", async (req, res) => {
  try {

    console.log(SECRET_KEY,"========================>SECRET_KEY")
    const { token, orderData } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const newToken = token.replace(/"/g, "");
    const verifiedToken = jwt.verify(newToken, SECRET_KEY);
console.log("=================verified Token==================");
console.log(verifiedToken);
console.log("=================verified Token==================");
console.log("=================orderData==================");
console.log(orderData);
console.log("=================orderData==================");

    // The customer client logs in via /api/login (Users + password); the token
    // is stateless { id, role, ... }. Resolve the Users account by `id`.
    const userId = verifiedToken.id || verifiedToken._id;
    const customer = await Users.findById(userId);

    if (!customer) {
      return res
        .status(400)
        .json({ message: "Customer not found or unauthorized" });
    }

    const {
      items,
      totalAmount,
      restaurantId,
      deliveryFee,
      deliveryAddress,
      paymentMethod,
      couponCode,
    } = orderData;

    // Re-validate coupon server-side; never trust client-computed discounts
    let couponDiscount = 0;
    let appliedCode = null;
    let couponDoc = null;
    if (couponCode) {
      couponDoc = await Coupon.findOne({
        code: couponCode.toUpperCase().trim(),
      });
      if (couponDoc) {
        const subtotal = (totalAmount || 0) - (deliveryFee || 0);
        const result = couponDoc.computeDiscount(subtotal);
        if (result.ok) {
          couponDiscount = result.discount;
          appliedCode = couponDoc.code;
        }
      }
    }

    const finalTotal = Math.max(0, (totalAmount || 0) - couponDiscount);

    const newOrder = new Order({
      customerId: customer._id,
      restaurantId: restaurantId || undefined,
      items,
      totalAmount: finalTotal,
      deliveryFee: deliveryFee || 0,
      deliveryAddress: deliveryAddress || undefined,
      paymentMethod: paymentMethod || "cod",
      couponCode: appliedCode,
      couponDiscount,
    });

    await newOrder.save();

    if (couponDoc && couponDiscount > 0) {
      couponDoc.usedCount = (couponDoc.usedCount || 0) + 1;
      await couponDoc.save();
    }

    customer.orders = customer.orders || [];
    customer.orders.push(newOrder._id);
    await customer.save();

    // Async fire-and-forget: email + in-app notification
    (async () => {
      try {
        const restaurant = restaurantId
          ? await Restaurant.findById(restaurantId).select("name")
          : null;
        sendOrderPlacedEmail({
          to: customer.email,
          order: newOrder,
          restaurantName: restaurant?.name,
        }).catch(() => {});
        emitToUser(String(customer._id), "order:placed", {
          orderId: newOrder._id,
          status: "placed",
        });
        // Notify the restaurant partner of the incoming order (live + Orders page).
        if (restaurantId) {
          emitToRestaurant(String(restaurantId), "order:new", {
            orderId: newOrder._id,
            customerName: customer.name,
            totalAmount: newOrder.totalAmount,
            itemCount: (items || []).reduce((n, i) => n + (i.quantity || 1), 0),
            status: newOrder.status,
            createdAt: newOrder.createdAt,
          });
        }
      }
      // @ts-ignore
      catch (e) {
        console.error("post-order notification:", e.message);
      }
    })();

    res
      .status(201)
      .json({ message: "Order placed successfully", order: newOrder });
  } catch (error) {
    // @ts-ignore
    console.error("Error placing order:", error);
    res.status(500).json({ error: error.message || "Error placing order" });
  }
});

export default router;

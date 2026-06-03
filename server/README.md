# FoodWorld Backend

This is the shared backend for the entire FoodWorld platform. It exposes the public APIs, admin APIs, partner APIs, payment endpoints, OTP workflows, and Socket.IO events used by all four frontends.

## What it does

- Authenticates customers, admins, restaurants, and delivery agents.
- Stores data in MongoDB via Mongoose.
- Sends email notifications for orders.
- Handles coupon validation and order placement.
- Integrates payment flows through Razorpay.
- Streams live updates with Socket.IO.
- Supports OTP generation and verification.
- Exposes public restaurant and menu endpoints.

## Platform and stack

- Runtime: Node.js
- Web server: Express
- Database: MongoDB
- ODM: Mongoose
- Auth: JSON Web Tokens
- Realtime: Socket.IO
- Payments: Razorpay
- Email: Nodemailer
- Security and middleware: CORS, cookie-parser, bcryptjs, dotenv

## Major route groups

- Public/customer routes: restaurant browsing, search, orders, reviews, coupons
- Admin routes: stats, users, delivery registry, order control
- Restaurant partner routes: onboarding, profile, categories, menu, orders
- Delivery routes: OTP login, availability, live location, delivery actions
- OTP routes: helper OTP endpoints
- Payment routes: create and verify payment orders

## Data models

- `User`
- `Customer`
- `Restaurant`
- `Category`
- `MenuItem`
- `Order`
- `Coupon`
- `Review`
- `DeliveryMan`
- `Otp`

## Realtime events

- User order status updates
- Restaurant incoming order events
- Delivery order availability/taken events
- Per-order update streams for tracking

## Local run

- Start the server: `npm start`
- Backend port: `5000`
- MongoDB connection in code currently points to `mongodb://localhost:27017/test`


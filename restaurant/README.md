# FoodWorld Restaurant Partner App

The restaurant app is the partner console for restaurant owners and staff. It handles OTP login, onboarding, menu management, and incoming order processing.

## What it does

- OTP-based login using the restaurant phone number.
- Onboard a restaurant listing after login.
- Edit restaurant profile and account details.
- Manage categories.
- Add, edit, and delete menu items.
- View incoming orders.
- Advance order status through the kitchen workflow.
- Receive live order events through Socket.IO.

## Platform and stack

- Frontend: React 18 with Create React App
- Routing: React Router v6
- Styling: Custom CSS
- Live updates: Socket.IO client
- Maps: not used directly in this app
- Icons: React Icons
- Networking: shared `fetch` wrapper

## Main pages

- `/login` restaurant OTP login
- `/onboarding` listing setup
- `/dashboard` partner summary dashboard
- `/categories` category management
- `/menu` menu management
- `/orders` incoming orders
- `/profile` restaurant profile
- `/account` alias for profile

## Key features

- OTP verification flow for restaurant accounts
- Onboarding flow that activates the restaurant listing
- Category CRUD
- Menu item CRUD with image upload support
- Order status updates for kitchen workflow
- Live socket updates when orders arrive or change state

## Backend integration

- Uses the shared backend at `http://localhost:5000`
- Partner routes are mounted under `/api/restaurant`
- Common endpoints include:
  - `/api/restaurant/register`
  - `/api/restaurant/auth/verify-otp`
  - `/api/restaurant/onboard/:id`
  - `/api/restaurant/:id/profile`
  - `/api/restaurant/:id/categories`
  - `/api/restaurant/categories/:categoryId/menu`
  - `/api/restaurant/menu-items/:id`
  - `/api/restaurant/:id/orders`
  - `/api/restaurant/orders/:orderId/status`

## Local run

- Start backend: `npm start` inside `server`
- Start partner app: `npm start` inside `restaurant`
- Restaurant app dev port: `5003`


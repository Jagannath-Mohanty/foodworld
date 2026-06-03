# FoodWorld Customer App

The customer app is the public-facing FoodWorld experience. It lets users browse restaurants and dishes, manage a cart, place orders, track delivery live, and leave ratings.

## What it does

- Browse the home page, featured restaurants, and food categories.
- Search restaurants, menu items, and categories.
- View restaurant details and restaurant menus.
- Add and remove items from the cart.
- Apply coupons and place orders.
- Track orders on a live map.
- Leave a review after delivery.
- View customer-facing notifications and toasts.

## Platform and stack

- Frontend: React 18 with Create React App
- Routing: React Router v6
- Styling: CSS modules/files plus custom global CSS
- State: React context for cart, location, and notifications
- Maps: Leaflet and React Leaflet
- Live updates: Socket.IO client
- Icons: React Icons
- Networking: browser `fetch`

## Main pages

- `/` home page
- `/restaurants` restaurant listing
- `/restaurants/:id` restaurant details
- `/search` global search page
- `/cart` shopping cart
- `/order` checkout and order placement
- `/orders/:id` live order tracking
- `/login` and `/signup`

## Key features

- Restaurant listing with search, veg-only filter, location filtering, and pagination
- Search results that group dishes by category
- Cart conflict handling when items from different restaurants are added
- Coupon application during checkout
- Live order status updates over sockets
- Customer notifications for order placement and status changes
- Delivery tracking on a map for active orders

## Backend integration

- Uses the shared backend at `http://localhost:5000`
- Public API paths are exposed under `/api`
- Important endpoints include:
  - `/api/restaurants`
  - `/api/items`
  - `/api/search`
  - `/api/coupons/apply`
  - `/api/customer/placeorder`
  - `/api/orders/:id`
  - `/api/payment/create-order`
  - `/api/payment/verify`

## Local run

- Start backend: `npm start` inside `server`
- Start customer app: `npm start` inside `client`
- Customer app dev port: `5002`


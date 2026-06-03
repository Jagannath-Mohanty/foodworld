# FoodWorld Delivery App

The delivery app is the driver/rider console. It is used to log in with OTP, receive delivery assignments, update availability, report live location, and complete deliveries.

## What it does

- OTP-based delivery-agent login.
- Toggle online/offline availability.
- Receive ready-for-pickup orders.
- Accept pickup assignments.
- Mark orders as delivered.
- Send live GPS location to the server.
- Show map-based delivery routes.
- Receive socket notifications when orders become available or are taken.

## Platform and stack

- Frontend: React 18 with Create React App
- Routing: React Router v6
- Styling: Custom CSS
- Maps: Leaflet and React Leaflet
- Live updates: Socket.IO client
- Icons: React Icons
- Networking: shared `fetch` wrapper

## Main pages

- `/login` delivery OTP login
- `/dashboard` active deliveries and available pickups

## Key features

- Session persistence in local storage
- Availability toggle for dispatch matching
- Geolocation streaming to support live tracking
- Pickup acceptance and delivery completion actions
- Live socket refresh for order availability changes

## Backend integration

- Uses the shared backend at `http://localhost:5000`
- Delivery routes are mounted under `/api/delivery`
- Common endpoints include:
  - `/api/delivery/auth/send-otp`
  - `/api/delivery/auth/verify-otp`
  - `/api/delivery/availability`
  - `/api/delivery/location`
  - `/api/delivery/orders/available`
  - `/api/delivery/orders/mine`
  - `/api/delivery/orders/:id/accept`
  - `/api/delivery/orders/:id/deliver`

## Local run

- Start backend: `npm start` inside `server`
- Start delivery app: `npm start` inside `delivery`
- Delivery app dev port: `5004`


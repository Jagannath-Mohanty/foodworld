# FoodWorld Admin App

The admin app is the internal control panel for managing the marketplace. It is used to oversee restaurants, menu items, orders, coupons, users, and delivery agents.

## What it does

- Manage restaurants: create, edit, deactivate, and open restaurant menus.
- Manage menu items for each restaurant.
- Review and process platform orders.
- Create and manage discount coupons.
- View and update user roles.
- Register and remove delivery agents.
- Monitor sales and marketplace metrics on the dashboard.

## Platform and stack

- Frontend: React 18 with Create React App
- Routing: React Router v6
- Styling: Custom CSS and component-level styles
- Charts: Recharts
- Live updates: Socket.IO client
- Icons: React Icons
- Networking: shared `fetch` wrapper with auth headers

## Main pages

- `/login` admin login
- `/dashboard` sales and marketplace analytics
- `/restaurants` restaurant list
- `/restaurants/new` create restaurant
- `/restaurants/:id/edit` edit restaurant
- `/restaurants/:id/menu` manage restaurant menu
- `/orders` order management board
- `/coupons` coupon management
- `/users` user and role management
- `/delivery-agents` delivery registry

## Key features

- Protected admin-only routes
- JWT-based admin session handling
- Restaurant CRUD and soft-deactivate flow
- Menu item edit and delete actions
- Order status advancement and cancellation
- Coupon creation and listing
- User role changes
- Delivery agent registration and removal
- Dashboard KPIs and order trend chart

## Backend integration

- Talks to the shared backend at `http://localhost:5000`
- Uses `/api` routes for all API requests
- Common endpoints include:
  - `/api/admin/stats`
  - `/api/admin/users`
  - `/api/admin/delivery-men`
  - `/api/admin/orders`
  - `/api/restaurants`
  - `/api/menu-items/:id`
  - `/api/coupons`

## Local run

- Start backend: `npm start` inside `server`
- Start admin app: `npm start` inside `admin`
- Admin app dev port: `5001`


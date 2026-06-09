# FoodWorld

A multi-app food-delivery platform. One Express/MongoDB backend serves four React
frontends (admin, customer, restaurant, delivery). All backend routes are exposed
under `/api`, and each frontend proxies to the server at `http://localhost:5000`.

## Apps & ports

| Folder        | App               | URL                     | Stack                          |
|---------------|-------------------|-------------------------|--------------------------------|
| `server/`     | Backend API       | http://localhost:5000   | Express, Mongoose, Socket.IO   |
| `admin/`      | Admin dashboard   | http://localhost:5001   | React (CRA)                    |
| `client/`     | Customer app      | http://localhost:5002   | React (CRA), Leaflet           |
| `restaurant/` | Restaurant app    | http://localhost:5003   | React (CRA)                    |
| `delivery/`   | Delivery-man app  | http://localhost:5004   | React (CRA), Leaflet           |

**Auth:** admin logs in with a password; customer, restaurant, and delivery users
log in via phone OTP.

## Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** running locally (`mongodb://localhost:27017`) or a connection string
  to a hosted instance (e.g. MongoDB Atlas)

## Setup

There is no root `package.json` — install dependencies in **each** app folder.

```bash
# from the repo root
cd server      && npm install && cd ..
cd admin       && npm install && cd ..
cd client      && npm install && cd ..
cd restaurant  && npm install && cd ..
cd delivery    && npm install && cd ..
```

### Configure the server environment

The server loads `server/.env` via `dotenv` (it is git-ignored). Create it:

```bash
# server/.env

# Database — defaults to mongodb://localhost:27017/test if unset
MONGODB_URL=mongodb://localhost:27017/foodworld

# JWT signing secret (required for login/auth)
SECRET_KEY=change-me-to-a-long-random-string

# Razorpay — required for online payments
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# SMTP — required for sending OTP / notification emails
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM="FoodWorld <no-reply@example.com>"
```

> Only `MONGODB_URL` and `SECRET_KEY` are needed to boot and log in. Razorpay and
> SMTP are required for payments and email/OTP delivery respectively.

The frontends need no `.env`; they hardcode their port and proxy `/api` to
`localhost:5000`.

## Running

Start the backend first, then each frontend in its own terminal.

```bash
cd server     && npm start   # API + Socket.IO on :5000
cd admin      && npm start   # :5001
cd client     && npm start   # :5002
cd restaurant && npm start   # :5003
cd delivery   && npm start   # :5004
```

`server` runs under `nodemon` and reloads on change. The React apps open in the
browser automatically.

## Useful scripts

- `server/`: `npm run db:push` — runs `scripts/dbPush.js` to seed/sync the database.
- Each React app: `npm run build` — production build.

## Notes

- Product/menu images are stored as base64 data URLs, so the server's JSON body
  limit is raised to 8 MB.
- Docker support is in progress — see the `Dockerfile`s in the repo root and app
  folders (not yet finalized).

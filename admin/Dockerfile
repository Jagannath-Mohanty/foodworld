# Admin dashboard (CRA) — build static assets, serve with nginx.
#   docker build -t foodworld-admin ./admin
#   docker run -p 5001:80 foodworld-admin

# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Runtime stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
# Serves the SPA, proxies /api and /socket.io to the backend (see nginx.conf).
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

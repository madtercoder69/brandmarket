# Stage 1: Build the frontend assets
FROM node:18-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install --legacy-peer-deps
COPY frontend/ .
RUN npm run build

# Stage 2: Setup nginx to serve built frontend and proxy backend API
FROM nginx:alpine
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
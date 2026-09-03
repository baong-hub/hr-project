# Build stage
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies first for layer caching
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy all frontend files
COPY . .

# Build Vite application to /app/dist
RUN npm run build

# Production serve stage
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Install openssl and generate self-signed certificate for UAT IP
RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/certs && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/certs/nginx-selfsigned.key \
    -out /etc/nginx/certs/nginx-selfsigned.crt \
    -subj "/CN=10.10.30.15" \
    -addext "subjectAltName=IP:10.10.30.15,DNS:localhost,IP:127.0.0.1"

# Clear default nginx html
RUN rm -rf ./*

# Copy dist files from build stage
COPY --from=build /app/dist .

# Copy custom Nginx configuration for single page application (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]

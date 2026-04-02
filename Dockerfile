# ==========================================
# Stage 1: Build
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install ALL deps including devDependencies (needed for Tailwind/PostCSS/Vite)
ENV NODE_ENV=development

COPY package.json package-lock.json* ./

# Use npm ci for clean, reproducible installs
RUN npm ci

# Copy source files
COPY . .

# Run Vite build
RUN npm run build

# ==========================================
# Stage 2: Production (Nginx)
# ==========================================
FROM nginx:stable-alpine

# Clean default static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx config (handles React Router fallback)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

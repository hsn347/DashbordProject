# ==========================================
# Stage 1: Build Image
# ==========================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Enable corepack for modern package managers (optional but good practice)
# RUN corepack enable

# Copy package files
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Install dependencies
RUN npm install

# Copy the rest of the project files
COPY . .

# Build the Vite project (Output typically goes to /app/dist)
RUN npm run build

# ==========================================
# Stage 2: Production Image (Nginx)
# ==========================================
FROM nginx:stable-alpine

# Remove default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration for React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port (Coolify usually maps 80 to the assigned port)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

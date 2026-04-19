# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm via corepack (ships with node:20-alpine, uses the
# packageManager field in package.json to pin the exact version).
RUN corepack enable

# Copy manifest + lockfile first to leverage Docker cache
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Build the application for production
# This runs tsc and vite build as defined in package.json
RUN pnpm run build

# Stage 2: Serve the application using Nginx
FROM nginx:1.27-alpine

# Set up a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy the built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the Nginx configuration file
# We'll create this file next. It's crucial for SPA routing.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the entrypoint script that will inject environment variables
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Expose port 80 for the web server
EXPOSE 80

# The entrypoint script will run first, then start Nginx
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

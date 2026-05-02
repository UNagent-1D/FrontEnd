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

# Vite reads VITE_* from process.env at build time and inlines them into the
# bundle. The compose file forwards the umbrella .env values via build.args;
# without these the bundle falls back to the localhost defaults baked into
# src/api/axios.ts, which only happens to work when the browser runs on the
# same host that exposes the service ports.
ARG VITE_TENANT_API_URL
ARG VITE_ORCH_API_URL
ARG VITE_METRICAS_API_URL
ARG VITE_CHAT_API_URL
ENV VITE_TENANT_API_URL=$VITE_TENANT_API_URL \
    VITE_ORCH_API_URL=$VITE_ORCH_API_URL \
    VITE_METRICAS_API_URL=$VITE_METRICAS_API_URL \
    VITE_CHAT_API_URL=$VITE_CHAT_API_URL

# Build the application for production
# This runs tsc and vite build as defined in package.json
RUN pnpm run build

# Stage 2: Serve the application using Nginx
FROM nginx:1.27-alpine

# Copy the built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the Nginx configuration file (crucial for SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the entrypoint script that injects environment variables
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Nginx master runs as root so it can bind :80; workers drop to the
# unprivileged nginx user automatically.

EXPOSE 80

# The entrypoint script will run first, then start Nginx
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

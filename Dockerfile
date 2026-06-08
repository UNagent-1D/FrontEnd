# Build the Next.js static export (output: 'export', distDir: 'dist') and serve
# it with nginx, which also reverse-proxies the API paths to backend Services so
# the browser sees a single origin.
#
# Why nginx instead of `node server.js`: next.config.ts sets output:'export',
# which produces a static site in dist/ and does NOT emit .next/standalone, so
# there is no server.js to run. The static bundle is the same one the prod
# Cloudflare Worker serves; here nginx fills the Worker's serve+route role.
FROM node:22-alpine AS builder
WORKDIR /app
# Pin pnpm 9: pnpm 10+ aborts the install over un-approved dependency build
# scripts (sharp, unrs-resolver). pnpm 9 builds them normally.
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Left empty by default: the SPA calls relative URLs (/api/v1, /v1, /auth, /stats)
# so all traffic is same-origin and nginx (below) routes it. Override only if the
# bundle must call a different origin.
ARG NEXT_PUBLIC_TENANT_API_URL=""
ARG NEXT_PUBLIC_ORCH_API_URL=""
ARG NEXT_PUBLIC_METRICAS_API_URL=""
ARG NEXT_PUBLIC_CHAT_API_URL=""
ENV NEXT_PUBLIC_TENANT_API_URL=$NEXT_PUBLIC_TENANT_API_URL \
    NEXT_PUBLIC_ORCH_API_URL=$NEXT_PUBLIC_ORCH_API_URL \
    NEXT_PUBLIC_METRICAS_API_URL=$NEXT_PUBLIC_METRICAS_API_URL \
    NEXT_PUBLIC_CHAT_API_URL=$NEXT_PUBLIC_CHAT_API_URL

RUN pnpm build

# ----------------------------------------------------------------------------
FROM nginx:alpine AS runner
# Static export output (distDir: 'dist')
COPY --from=builder /app/dist /usr/share/nginx/html
# Single-origin reverse proxy (serves the SPA + proxies /v1, /auth, /api, /stats)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

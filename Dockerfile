FROM node:22-alpine AS builder

  WORKDIR /app
  # Pin pnpm 9: pnpm 10+ aborts the install over un-approved dependency
  # build scripts (sharp, unrs-resolver). pnpm 9 builds them normally.
  RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

  COPY package.json pnpm-lock.yaml ./
  RUN pnpm install --frozen-lockfile

  COPY . .

  ARG NEXT_PUBLIC_TENANT_API_URL
  ARG NEXT_PUBLIC_ORCH_API_URL
  ARG NEXT_PUBLIC_METRICAS_API_URL
  ARG NEXT_PUBLIC_CHAT_API_URL
  ENV NEXT_PUBLIC_TENANT_API_URL=$NEXT_PUBLIC_TENANT_API_URL \
      NEXT_PUBLIC_ORCH_API_URL=$NEXT_PUBLIC_ORCH_API_URL \
      NEXT_PUBLIC_METRICAS_API_URL=$NEXT_PUBLIC_METRICAS_API_URL \
      NEXT_PUBLIC_CHAT_API_URL=$NEXT_PUBLIC_CHAT_API_URL

  RUN pnpm build

  FROM node:22-alpine AS runner

  WORKDIR /app
  ENV NODE_ENV=production
  RUN corepack enable

  COPY --from=builder /app/.next/standalone ./
  COPY --from=builder /app/.next/static ./.next/static
  COPY --from=builder /app/public ./public

  EXPOSE 3000
  ENV PORT=3000
  ENV HOSTNAME=0.0.0.0

  CMD ["node", "server.js"]

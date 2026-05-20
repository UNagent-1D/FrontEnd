FROM node:20-alpine AS builder

  WORKDIR /app
  # corepack on Node 20.19+ has a dynamic-import bug that breaks
  # `pnpm install` (ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING). Install
  # pnpm directly via npm to bypass corepack entirely.
  RUN npm install -g pnpm@9

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

  FROM node:20-alpine AS runner

  WORKDIR /app
  ENV NODE_ENV=production

  COPY --from=builder /app/.next/standalone ./
  COPY --from=builder /app/.next/static ./.next/static
  COPY --from=builder /app/public ./public

  EXPOSE 3000
  ENV PORT=3000
  ENV HOSTNAME=0.0.0.0

  CMD ["node", "server.js"]

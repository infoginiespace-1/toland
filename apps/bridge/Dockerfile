FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@12.18.0 --activate

# Copy monorepo configuration
COPY pnpm-lock.yaml* pnpm-workspace.yaml package.json ./
COPY packages/shared packages/shared/
COPY apps/bridge apps/bridge/

# Install dependencies and build
RUN pnpm --filter "@toland/bridge..." install --frozen-lockfile || pnpm --filter "@toland/bridge..." install
RUN pnpm --filter "@toland/bridge" build

# Production runtime image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@12.18.0 --activate

COPY --from=builder /app/pnpm-lock.yaml* /app/pnpm-workspace.yaml /app/package.json ./
COPY --from=builder /app/packages/shared packages/shared/
COPY --from=builder /app/apps/bridge/package.json apps/bridge/
COPY --from=builder /app/apps/bridge/dist apps/bridge/dist/

RUN pnpm --filter "@toland/bridge" install --prod

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/status || exit 1

CMD ["node", "apps/bridge/dist/index.js"]

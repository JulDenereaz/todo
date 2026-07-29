FROM node:22-alpine AS builder
WORKDIR /app

# better-sqlite3 has no prebuilt binary for musl/alpine — build it from source.
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─── Production-only node_modules ─────────────────────────────────────────────
# Next's standalone output only traces what the Next app itself imports.
# scripts/migrate.ts runs outside that bundle (via tsx) and needs full,
# real module resolution (drizzle-orm, tsx's own deps, etc.), so it gets a
# proper `npm ci --omit=dev` tree instead of cherry-picked folders.
FROM node:22-alpine AS prod-deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ─── Runtime image ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static     ./.next/static
COPY --from=builder /app/public           ./public
COPY --from=prod-deps /app/node_modules   ./node_modules
COPY --from=builder /app/drizzle          ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/scripts          ./scripts

RUN mkdir -p /app/data

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["sh", "-c", "node_modules/.bin/tsx scripts/migrate.ts && node server.js"]

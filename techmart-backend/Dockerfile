# ── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

RUN addgroup -g 1001 -S nodejs && adduser -S techmart -u 1001

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY . .

USER techmart

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "src/server.js"]

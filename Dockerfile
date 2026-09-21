# -------- Stage 1: Build --------
FROM node:lts-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

ENV NODE_ENV=production
RUN npm run build

# -------- Stage 2: Production --------
FROM node:lts-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN mkdir .next && chown node:node .next

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Migrations run before the server starts (drizzle-orm migrator).
COPY --from=builder --chown=node:node /app/drizzle ./drizzle
COPY --from=builder --chown=node:node /app/scripts/migrate.mjs ./scripts/migrate.mjs
COPY --from=builder --chown=node:node /app/scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
COPY --from=builder --chown=node:node /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=builder --chown=node:node /app/node_modules/postgres ./node_modules/postgres

RUN chmod +x ./scripts/docker-entrypoint.sh

USER node

EXPOSE 3000

CMD ["./scripts/docker-entrypoint.sh"]

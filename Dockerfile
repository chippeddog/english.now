# syntax=docker/dockerfile:1.4

###########
# Base tool image: node + pnpm + turbo
###########
FROM node:22-alpine AS base

RUN apk add --no-cache gcompat curl \
  && npm install -g pnpm turbo

ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH

WORKDIR /repo

###########
# Dependencies layer
###########
FROM base AS deps

# Root manifests (for catalogs + workspaces)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Package manifests only (better cache)
COPY apps/server/package.json apps/server/package.json
COPY packages ./packages

# Install all workspace deps (uses catalogs & workspace:*)
RUN pnpm install --frozen-lockfile

###########
# Build server via Turbo
###########
FROM deps AS builder

# Copy full source
COPY . .

# Build only the server package (name from apps/server/package.json)
RUN turbo run build --filter=server

# Prune to production deps only for server
RUN pnpm prune --filter server --prod

###########
# Runtime image
###########
FROM node:22-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 hono

# Copy built server + its node_modules
COPY --from=builder --chown=hono:nodejs /repo/apps/server/dist ./dist
COPY --from=builder --chown=hono:nodejs /repo/apps/server/package.json ./package.json
COPY --from=builder --chown=hono:nodejs /repo/apps/server/node_modules ./node_modules

USER hono
EXPOSE 3000
CMD ["node", "dist/index.js"]

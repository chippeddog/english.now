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

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

COPY apps/server/package.json apps/server/package.json
COPY packages ./packages

RUN pnpm install --frozen-lockfile

###########
# Production dependencies only (hoisted → real files, no symlinks)
###########
FROM base AS proddeps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

COPY apps/server/package.json apps/server/package.json
COPY packages ./packages

RUN pnpm install --frozen-lockfile --prod

###########
# Build server via Turbo
###########
FROM deps AS builder

COPY . .

RUN turbo run build --filter=server

###########
# Runtime image
###########
FROM node:22-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 hono

COPY --from=builder --chown=hono:nodejs /repo/apps/server/dist ./dist
COPY --from=builder --chown=hono:nodejs /repo/apps/server/package.json ./package.json
COPY --from=proddeps --chown=hono:nodejs /repo/node_modules ./node_modules

USER hono
EXPOSE 3000
CMD ["node", "dist/index.js"]

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

`english.now` is a pnpm + Turborepo TypeScript monorepo for an AI-powered English language learning SaaS. It includes a web app, API server, and React Native mobile app sharing typed packages.

```
apps/
  web/      # React 19 + TanStack Start (port 3001)
  server/   # Hono + tRPC API server (port 3000)
  native/   # Expo / React Native
packages/
  api/      # tRPC routers + domain services
  auth/     # Better Auth config (Google, Apple OAuth)
  db/       # Drizzle ORM schema + migrations
  env/      # Zod environment validation (server + client)
  email/    # Email templates and delivery
  i18n/     # 14-language translations + RTL support
  shared/   # Feature limit constants
```

## Commands

```bash
# Development
pnpm dev              # all apps
pnpm dev:web          # web only
pnpm dev:server       # server only
pnpm dev:native       # native only

# Validation (no test suite; use type/build checks)
pnpm check-types                # full workspace typecheck
pnpm -F server check-types      # server only
pnpm -F web build               # web build (catches type + bundle errors)

# Database (reads from apps/server/.env)
pnpm db:push          # apply schema to DB
pnpm db:generate      # generate migrations
pnpm db:migrate       # run migrations
pnpm db:studio        # open Drizzle Studio

# Formatting — modifies files, treat as a write command
pnpm check            # runs biome check --write .
```

## Code Style

- **Formatter/linter:** Biome (not ESLint/Prettier)
- **Indentation:** tabs
- **Quotes:** double quotes
- **Imports:** `import type { X } from "y"` preferred; import organization is enforced
- **Components:** function declarations, not arrow functions for exports
- **className merging:** `cn()` from `@/lib/utils`
- **Path alias:** `@/` maps to `src/` within each app

## Architecture

### Request Flow

1. Web client calls `${VITE_SERVER_URL}/trpc` with credentials (cookies)
2. Hono server (`apps/server/src/index.ts`) mounts tRPC at `/trpc/*`
3. tRPC context includes: Better Auth session, client IP, job enqueue function
4. Domain logic lives in `packages/api/src/routers/` and `packages/api/src/services/`
5. For streaming/WebSocket needs, REST routes exist at `/api/conversation`, `/api/content`, `/api/pronunciation`, `/api/upload`, `/api/paddle`

### tRPC Routers (`packages/api/src/routers/`)

`profile`, `grammar`, `vocabulary`, `conversation`, `pronunciation`, `content`, `practice`, `feedback`, `contact`, `issueReport`

### Background Jobs (pg-boss via PostgreSQL)

Registered in `apps/server/src/jobs/index.ts`:
- `generate-daily-practice-plan`, `generate-conversation-feedback`, `generate-pronunciation-feedback`, `process-pronunciation-session`, `add-conversation-vocabulary`, `generate-learning-path`, `cleanup-rate-limits`

### Auth (Better Auth)

Config in `packages/auth/src/index.ts`. Providers: Google + Apple OAuth, email/password. Sessions are cookie-based (sameSite=lax, httpOnly, cross-subdomain at `.english.now`). Better Auth auto-creates `user_profile` on user creation via a hook.

### Database (Drizzle + PostgreSQL)

Schema files in `packages/db/src/schema/`. Key tables: `user_profile`, `curriculum` (topics/lessons with CEFR levels + prerequisites graph), `conversation`, `pronunciation`, `vocabulary`, `subscription`, `feature-usage`, `rate-limit`.

### Feature Gating

`packages/api/src/services/feature-gating.ts` enforces free-tier limits (1 daily lesson, 1 conversation, 1 pronunciation session, 15 vocab reviews). Subscription data comes from Paddle webhooks.

### Domain Concepts

- **CEFR levels:** A1, A2, B1, B2, C1, C2
- **Mastery states:** `not_started`, `struggling`, `learning`, `mastered`
- **Topics** have prerequisites forming a learning graph
- **Vocabulary** uses SM-2 spaced repetition (`packages/api/src/services/sm-2.ts`)
- **i18n:** 14 languages; English eagerly bundled, others lazy-loaded; Arabic triggers RTL

## UI Patterns

- shadcn/ui component patterns from `components/ui/`
- CEFR badges are color-coded: A1=emerald → A2=teal → B1=blue → B2=indigo → C1=purple → C2=rose
- Drawer panels slide from right
- ReactFlow for graph visualizations (learning path/topic prerequisites)

## Sensitive Areas

Changes in these areas have cross-app impact:

- `packages/auth` — cookie settings or trusted origins affect all clients including native
- `packages/db` — schema changes require migration; never hand-edit `routeTree.gen.ts` or other generated files
- `packages/env` — validation failures break startup across all apps
- `apps/server/src/index.ts` — all integrations are wired here

## Environment Setup

1. `pnpm install`
2. Copy and fill `apps/server/.env.example` → `apps/server/.env`
3. `pnpm db:push`
4. `pnpm dev`

Also see `apps/web/.env.example` and `apps/native/.env.example`. Local CORS values and ports must match; verify these before assuming auth failures are code bugs.

# AGENTS.md

## Cursor Cloud specific instructions

### Architecture

This is a TypeScript monorepo (Turborepo + pnpm workspaces) for an AI-powered English language learning platform. See `README.md` for the full project structure and available scripts.

### Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Backend API (Hono + tRPC) | `pnpm dev:server` | 3000 | Requires PostgreSQL running; uses `apps/server/.env` |
| Web frontend (Vite + TanStack Start) | `pnpm dev:web` | 3001 | Uses `apps/web/.env` |
| React Native (Expo) | `pnpm dev:native` | — | Optional; needs Expo Go or emulator |

### Database

PostgreSQL must be running before starting the server. The DB schema is managed by Drizzle ORM. Push schema with `pnpm db:push`. The drizzle config reads from `apps/server/.env`.

### Environment variables

- Server env validation is strict (`packages/env/src/server.ts`). All external API keys (OpenAI, Deepgram, Azure Speech, R2, Paddle, AutoSend) must be present even if placeholder values. The server **will not start** without them.
- Web client requires `VITE_SERVER_URL` and `VITE_PADDLE_CLIENT_TOKEN` in `apps/web/.env`.
- See `apps/server/.env.example` and `apps/web/.env.example` for templates.

### Linting and formatting

Uses Biome (not ESLint/Prettier). Run `pnpm check` (which is `biome check --write .`) to auto-fix. Run `npx biome check .` for check-only mode.

### Building

`pnpm build` builds all packages. The web app uses Vite, the server uses tsdown, and shared packages use tsdown.

### Gotchas

- `pnpm install` may warn about ignored build scripts for `esbuild` and `ffmpeg-static`. The `pnpm.onlyBuiltDependencies` field in root `package.json` allowlists them.
- The server imports `dotenv/config` at the top of `src/index.ts`, so it reads `.env` from `apps/server/.env` automatically.
- There are pre-existing TypeScript errors in the codebase (`pnpm check-types` fails on server). These do not prevent dev mode from running.
- The `CORS_ORIGIN` in server `.env` must match the web dev server origin (`http://localhost:3001`).
- Route warnings like `"does not contain any route piece"` from TanStack Router on web dev startup are benign.

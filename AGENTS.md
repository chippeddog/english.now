# AGENTS.md

## Purpose

This repository is a `pnpm` + Turborepo TypeScript monorepo with:

- `apps/web`: React 19 + Vite + TanStack Start web app
- `apps/server`: Hono + tRPC Node server
- `apps/native`: Expo / React Native app
- `packages/*`: shared API, auth, DB, env, email, and i18n code

Use this file as the default operating guide for coding agents working in this repo.

## Workspace map

- `apps/web`: frontend, content collections, Cloudflare deployment config
- `apps/server`: API server, auth hooks, websockets, background workers
- `apps/native`: Expo app with Expo Router and NativeWind
- `packages/api`: shared tRPC API primitives
- `packages/auth`: Better Auth configuration and trusted origins
- `packages/db`: Drizzle schema, migrations, and DB scripts
- `packages/env`: shared Zod-based environment validation
- `packages/email`: email-related shared code
- `packages/i18n`: translations and translation tooling

## Package manager and task runner

- Package manager: `pnpm` (`packageManager: pnpm@10.2.0`)
- Task runner: `turbo`
- Workspace definitions: `apps/*` and `packages/*`

Prefer `pnpm` for all install and script commands. Do not introduce another package manager.

## Common commands

From the repo root:

- `pnpm install`: install dependencies
- `pnpm dev`: run all dev tasks through Turbo
- `pnpm build`: build the workspace
- `pnpm check-types`: run workspace typechecking tasks
- `pnpm dev:web`: run only the web app
- `pnpm dev:server`: run only the server
- `pnpm dev:native`: run only the native app
- `pnpm db:push`: push Drizzle schema to the configured database
- `pnpm db:generate`: generate Drizzle migrations
- `pnpm db:migrate`: run Drizzle migrations
- `pnpm db:studio`: open Drizzle Studio

Useful package-level commands:

- `pnpm -F server check-types`
- `pnpm -F web build`
- `pnpm -F native dev`

## Validation guidance

There is no obvious repo-wide `test` script wired today. Default to the smallest relevant validation for the files you changed.

Recommended checks:

- Server changes: `pnpm -F server check-types`
- Web changes: `pnpm -F web build`
- Shared package changes: `pnpm check-types`
- Formatting/linting when needed: use Biome intentionally

Important: `pnpm check` runs `biome check --write .`, which **modifies files**. Treat it as a write command, not a read-only verification step.

## Formatting and code style

- Formatter/linter: Biome
- Indentation: tabs
- JavaScript/TypeScript quotes: double quotes
- Import organization is enabled
- TypeScript is strict across the repo

Keep changes consistent with existing patterns. Avoid introducing one-off conventions when the surrounding package already has a clear style.

## Generated and sensitive files

Do not hand-edit generated artifacts unless the task explicitly requires regenerating them:

- `**/routeTree.gen.ts`
- generated content collection output
- build outputs such as `dist/`, `.turbo/`, and app-specific generated directories

Be careful with changes in these areas:

- `packages/auth`: cookie settings, trusted origins, native/web auth flows
- `packages/db`: schema, migrations, and anything that hits a live database
- `packages/env`: env validation can break startup across apps
- `apps/server/src/index.ts`: many integrations are wired together here

## Environment notes

Setup is documented in `README.md`:

1. `pnpm install`
2. configure `apps/server/.env`
3. run `pnpm db:push`
4. run `pnpm dev`

Relevant env examples:

- `apps/server/.env.example`
- `apps/web/.env.example`
- `apps/native/.env.example`

Notes:

- DB tooling reads from server env configuration, so DB commands are stateful.
- The server env schema is strict and includes many third-party integrations.
- Local configuration may drift; verify ports and CORS values before assuming local auth issues are code bugs.

## Practical guidance for agents

- Read the nearest package config before making changes.
- Prefer targeted commands over whole-repo commands when possible.
- Keep edits scoped; this is a multi-app monorepo, so unrelated regressions are easy to introduce.
- If touching auth, env, or DB code, call out cross-app impact in your summary.
- If you need formatting, prefer formatting only the files you changed when practical.
- Do not assume missing tests mean no verification is needed; run type/build checks that fit the changed surface area.

## When in doubt

- Start at `README.md` and the relevant package's `package.json`.
- Use root scripts first, then narrow to `pnpm -F <package> ...` commands.
- Favor safe, incremental changes over wide refactors unless the task explicitly asks for them.

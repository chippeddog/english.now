# english.now

An open-source language learning platform built to help learners practice real English in realistic situations. The project combines an AI-powered web experience, a mobile app, and a shared TypeScript backend so new features can ship across platforms without duplicating business logic.

## Why this project exists

Most language products are either too generic, too game-like, or too disconnected from real conversation. This project focuses on practical learning:

- AI conversations for speaking practice
- instant feedback on grammar and fluency
- pronunciation support
- vocabulary review and spaced repetition
- adaptive lessons and progress tracking
- shared infrastructure for web, mobile, auth, payments, email, and data

## Highlights

- **Cross-platform**: web app, API server, and Expo mobile app in one monorepo
- **Type-safe end to end**: TypeScript, tRPC, shared packages, and Zod validation
- **AI-assisted learning**: OpenAI-powered practice flows and translation features
- **Speech and audio workflows**: pronunciation and speaking support
- **Production-oriented foundation**: auth, database, email, storage, and payments already wired in
- **Designed for iteration**: Turborepo + pnpm workspace structure for faster development

## Tech stack

### Apps

- **Web**: React 19, Vite, TanStack Start, Tailwind CSS
- **Server**: Hono, tRPC, Node.js, Better Auth
- **Mobile**: Expo, React Native, Expo Router

### Shared infrastructure

- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod
- **Tooling**: pnpm, Turborepo, Biome, TypeScript
- **Integrations**: OpenAI, Deepgram, Cloudflare R2, Paddle, AutoSend

## Monorepo structure

```text
.
├── apps/
│   ├── web/       # React + TanStack Start frontend
│   ├── server/    # Hono + tRPC API server
│   └── native/    # Expo / React Native app
├── packages/
│   ├── api/       # Shared API routers, services, and domain logic
│   ├── auth/      # Better Auth configuration and auth helpers
│   ├── db/        # Drizzle schema, DB client, and migration scripts
│   ├── env/       # Shared environment validation
│   ├── email/     # Email helpers and templates
│   └── i18n/      # Translation tooling and dictionaries
└── package.json   # Root scripts and workspace configuration
```

## How the pieces fit together

- `apps/web` and `apps/native` consume shared code from `packages/*`
- `apps/server` exposes the backend API and integrates auth, payments, AI, storage, and background workflows
- `packages/api` keeps business logic and API contracts reusable across clients
- `packages/db`, `packages/auth`, and `packages/env` centralize the sensitive parts of the stack so behavior stays consistent everywhere

## Getting started

### Prerequisites

Before running the project locally, make sure you have:

- **Node.js** 20+
- **pnpm** 10.2+
- **PostgreSQL**
- Optional accounts or API keys for the integrations you want to test locally

### 1) Install dependencies

```bash
pnpm install
```

### 2) Create environment files

Use the example files as your starting point:

- `apps/server/.env.example`
- `apps/web/.env.example`
- `apps/native/.env.example`

```bash
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
cp apps/native/.env.example apps/native/.env
```

At minimum, you will usually need:

- a PostgreSQL connection string
- Better Auth secrets and base URL
- the web and native app server URLs

If you want full feature parity locally, also configure the optional integrations for AI, storage, email, and payments.

### 3) Initialize the database

```bash
pnpm db:push
```

This applies the current Drizzle schema to your configured database.

### 4) Start the development environment

```bash
pnpm dev
```

Typical local targets:

- **Web app**: Vite dev server from `apps/web` (configured on port `3001`)
- **API server**: Hono server from `apps/server` (commonly port `3000`)
- **Mobile app**: Expo dev server from `apps/native`

If you only need one surface, you can run it independently:

```bash
pnpm dev:web
pnpm dev:server
pnpm dev:native
```

## Useful commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run all app dev tasks through Turbo |
| `pnpm build` | Build the workspace |
| `pnpm check-types` | Run TypeScript checks across the workspace |
| `pnpm dev:web` | Start only the web app |
| `pnpm dev:server` | Start only the API server |
| `pnpm dev:native` | Start only the Expo app |
| `pnpm db:push` | Push the Drizzle schema to the database |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Run Drizzle migrations |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm check` | Run Biome with `--write` across the repo |

## Validation

There is no single repo-wide test command set up yet, so use the smallest relevant check for the area you changed:

- **Server changes**: `pnpm -F server check-types`
- **Web changes**: `pnpm -F web build`
- **Shared package changes**: `pnpm check-types`

Note that `pnpm check` is a write command because it runs `biome check --write .`.

## Development workflow

1. Make your changes in the relevant app or package.
2. Run targeted validation for the code you touched.
3. Keep shared logic in `packages/*` when it is used by more than one app.
4. Be careful with auth, env, and database changes because they affect multiple surfaces.

## Contributing

Contributions are welcome.

If you want to open a PR, a good default workflow is:

1. Fork the project and create a feature branch.
2. Keep changes focused and easy to review.
3. Run the relevant validation commands before submitting.
4. Include setup notes or screenshots when changing developer experience or UI.

Areas where contributions are especially valuable:

- learner experience and onboarding
- lesson generation and feedback quality
- mobile polish
- documentation
- tests and CI coverage
- accessibility and internationalization

## Environment notes

A large part of the system is driven by server-side environment variables. The server env controls important integrations such as:

- database access
- Better Auth
- Cloudflare R2 storage
- OpenAI and Deepgram
- AutoSend email delivery
- Paddle billing

If something fails during local setup, the first thing to verify is usually the relevant `.env` file.

## Built with

This repository started from the excellent [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack) and has been expanded into a multi-app product architecture.

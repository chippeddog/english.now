# english.now

An open-source platform for learning practical English: AI conversation practice, real-time tutor calls, pronunciation feedback, grammar drills, spaced-repetition vocabulary and CEFR-aligned lessons (A1 to C2). It runs as a web app, an API server and an Expo mobile app that share one TypeScript codebase.

The project is a foundation that anyone can run, study and extend. Only a PostgreSQL database and an OpenAI API key are required; every other integration is optional, and the features that depend on it are hidden until you configure it.

## Features

- **AI conversations**: topic and roleplay chats with hints, translation and a review of grammar and vocabulary mistakes
- **Tutor calls**: real-time voice calls over the OpenAI Realtime API, with live captions
- **Pronunciation**: read-aloud practice with phoneme-level scoring (Azure Speech)
- **Grammar**: topic explanations, drills and a prerequisite graph
- **Vocabulary**: words and phrases with translations, audio and SM-2 spaced repetition
- **Lessons**: CEFR courses made of units and lessons with generated exercises
- **14 interface languages**, including right-to-left Arabic

## Quick start

Prerequisites: Node.js 22+, pnpm 10+, Docker (or any PostgreSQL 16 server), and an [OpenAI API key](https://platform.openai.com/api-keys).

```bash
pnpm install

# 1. Start PostgreSQL
docker compose up -d

# 2. Configure environment variables
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
#    In apps/server/.env, set OPENAI_API_KEY and a random BETTER_AUTH_SECRET:
#    openssl rand -base64 32

# 3. Create the schema and load starter content
pnpm db:migrate
pnpm db:seed

# 4. Run the web app (http://localhost:3001) and API (http://localhost:3000)
pnpm dev:server
pnpm dev:web
```

Sign up with email and password. Without an email provider, verification is skipped, and password reset links are printed to the server log.

## What each integration enables

The server prints the enabled integrations on startup, for example `[capabilities] billing=off deepgram=on ...`.

| Integration | Environment variables | Without it |
| --- | --- | --- |
| **PostgreSQL** (required) | `DATABASE_URL` | — |
| **OpenAI** (required) | `OPENAI_API_KEY` | — |
| Google sign-in | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google button is hidden |
| Apple sign-in | `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET` | Apple button is hidden |
| Email (AutoSend) | `AUTOSEND_API_KEY`, `AUTOSEND_*_TEMPLATE_ID` | No email verification; emails are logged |
| Deepgram | `DEEPGRAM_API_KEY` | Speech-to-text and text-to-speech use OpenAI; live read-aloud transcription is off |
| Azure Speech | `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` | Pronunciation practice is hidden; conversation reviews skip pronunciation scores |
| Cloudflare R2 | `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_URL` | Audio and avatars are stored on local disk (`LOCAL_STORAGE_DIR`) and served from `/files` |
| Paddle billing | `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET` (+ `VITE_PADDLE_*` in the web app) | Billing UI is hidden and every learner gets unlimited access |
| Langfuse | `LANGFUSE_*` | No LLM tracing |
| Sentry | `SENTRY_DSN`, `VITE_SENTRY_DSN` | No error reporting |

Read-aloud pronunciation practice needs both Deepgram (live transcript) and Azure Speech (scoring).

## Starter content

`pnpm db:seed` loads `packages/db/seed/curriculum.json` when it exists: the published courses, lessons and grammar topics. Without that file it seeds the built-in grammar topics, and you can generate courses with OpenAI:

```bash
pnpm content:curriculum:generate
```

Maintainers refresh the committed snapshot from a database with published content using `pnpm -F @english.now/db seed:export`. The snapshot contains content tables only, never users or learner progress.

## Architecture

```text
apps/
  web/       React 19 + TanStack Start (Cloudflare Workers)
  server/    Hono + tRPC API, REST streaming routes, pg-boss background jobs
  native/    Expo / React Native
packages/
  api/       tRPC routers and domain services (shared by server and clients' types)
  auth/      Better Auth configuration
  db/        Drizzle schema, migrations and seeds
  env/       Environment validation and the `capabilities` flags
  email/     Transactional email
  i18n/      Translations
  shared/    Free-tier limit constants
  content/   Scripts that generate curriculum and grammar content
```

- The web and native apps call the API over tRPC (`/trpc`) with cookie or bearer sessions; streaming chat, audio upload and webhooks use REST routes under `/api`.
- Background work (feedback generation, daily practice plans, pronunciation scoring) runs in pg-boss queues stored in PostgreSQL, so no extra infrastructure is needed.
- Free-tier limits live in `packages/shared/src/feature-limit-config.ts` and are enforced atomically on the server in `packages/api/src/services/feature-usage.ts`.

## Self-hosting

1. Provision PostgreSQL 16 and run `pnpm db:migrate` and `pnpm db:seed` against it.
2. Deploy the API server. The root `Dockerfile` builds it; it needs `ffmpeg` (included) for pronunciation scoring. Set at least the required variables plus:
   - `BETTER_AUTH_URL`: the public API URL
   - `CORS_ORIGIN` and `APP_URL`: the public web URL
   - `COOKIE_DOMAIN`: the shared parent domain (for example `.example.com`) when the web app and API are on different subdomains
   - `NODE_ENV=production`
   - R2 (or keep a persistent volume for `LOCAL_STORAGE_DIR`)
3. Deploy the web app to Cloudflare Workers: copy `apps/web/wrangler.example.jsonc` to `wrangler.jsonc`, set `VITE_SERVER_URL` and `VITE_APP_URL`, then run `pnpm -F web deploy`.
4. For billing, configure Paddle on both the server and the web app, and point the Paddle webhook to `https://<api>/api/paddle/webhook`.

## Development

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run all apps |
| `pnpm dev:web` / `dev:server` / `dev:native` | Run one app |
| `pnpm check-types` | Typecheck the workspace |
| `pnpm test` | Run unit tests |
| `pnpm -F web build` | Production build of the web app |
| `pnpm db:generate` | Generate a migration after changing the schema |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:seed` | Load starter content |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm check` | Format and lint with Biome (writes files) |

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow and [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## License

[MIT](LICENSE)

This repository started from [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack).

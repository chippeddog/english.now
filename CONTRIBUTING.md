# Contributing to english.now

Thanks for helping build an open foundation for learning English. This guide covers how to get the project running, how we work, and what a good pull request looks like.

## Ways to contribute

- Fix bugs and report issues with clear reproduction steps
- Improve learner experience: lessons, feedback quality, accessibility
- Translate the interface (`packages/i18n/src/locales/*`)
- Improve curriculum content and grammar explanations
- Add tests and documentation

If you plan a larger change (a new feature, a schema change, a new integration), open an issue first so we can agree on the approach before you invest time.

## Local setup

The short version (see the [README](README.md) for details):

```bash
pnpm install
docker compose up -d                       # local Postgres
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Only `DATABASE_URL`, `BETTER_AUTH_SECRET` and `OPENAI_API_KEY` are required. Every other integration (Google sign-in, email, billing, Azure Speech, Deepgram, R2) is optional, and features that depend on it are hidden when it is not configured.

## Project layout

| Path | What lives there |
| --- | --- |
| `apps/web` | React 19 + TanStack Start web app |
| `apps/server` | Hono + tRPC API server, REST routes, background jobs |
| `apps/native` | Expo / React Native app |
| `packages/api` | tRPC routers and domain services |
| `packages/db` | Drizzle schema, migrations and seeds |
| `packages/auth` | Better Auth configuration |
| `packages/env` | Environment validation and feature capabilities |
| `packages/i18n` | Translations |

## Code style

- Formatting and linting use [Biome](https://biomejs.dev): tabs, double quotes, organized imports.
- Run `pnpm check` to format and fix (it writes files), or `pnpm exec biome ci .` for a read-only check.
- Prefer `import type` for type-only imports.
- Export React components as function declarations.
- Do not hand-edit generated files such as `routeTree.gen.ts`.

## Before opening a pull request

Run the checks that CI runs:

```bash
pnpm check-types
pnpm test
pnpm -F web build
```

Database changes:

1. Edit the schema in `packages/db/src/schema`.
2. Run `pnpm db:generate` and commit the generated migration.
3. Make sure `pnpm db:migrate` works against an empty database.

## Pull request guidelines

- Keep pull requests focused on one change.
- Describe what changed and why, and how you tested it.
- Include screenshots or a short recording for UI changes.
- Call out changes to `packages/auth`, `packages/env` or `packages/db`, since they affect every app.

## Reporting security issues

Please do not open public issues for vulnerabilities. See [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).

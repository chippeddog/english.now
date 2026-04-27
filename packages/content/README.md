# @english.now/content

Internal content tooling for `english.now`.

This package contains non-deployable scripts for generating and managing product content such as curriculum, grammar topics, and grammar practice sets. Keep these scripts out of `apps/server` so the server package stays focused on the deployable API runtime.

## When To Put Code Here

Use this package for CLI/admin tools that:

- generate curriculum or learning content
- write grammar topics or practice sets to the database
- call AI providers for content creation
- are run manually by maintainers or operators
- should not be bundled into the production server

Do not use this package for:

- API routes or request handlers
- reusable domain services used at runtime
- database schema, migrations, or pure seed/backfill scripts
- frontend or mobile content rendering

Reusable runtime logic should live in `packages/api`. Database schema, migrations, and low-level seeds should live in `packages/db`.

## Environment

The scripts currently load environment variables from:

```bash
apps/server/.env
```

Required variables depend on the script, but most content generation tasks need:

- `DATABASE_URL`
- `OPENAI_API_KEY`

Run scripts from the repository root unless a command says otherwise.

## Commands

From the repository root:

```bash
pnpm content:grammar:generate
pnpm content:grammar:practice
pnpm content:grammar:topic
pnpm content:curriculum:generate
pnpm content:curriculum:manage
```

Equivalent package-scoped commands:

```bash
pnpm -F @english.now/content grammar:generate
pnpm -F @english.now/content grammar:practice
pnpm -F @english.now/content grammar:topic
pnpm -F @english.now/content curriculum:generate
pnpm -F @english.now/content curriculum:manage
```

## Examples

Generate grammar topics:

```bash
pnpm content:grammar:generate -- --level A2
```

Generate grammar practice sets:

```bash
pnpm content:grammar:practice -- --level A2 --count 30
```

Generate a draft curriculum:

```bash
pnpm content:curriculum:generate -- --level B1
```

Manage curriculum versions:

```bash
pnpm content:curriculum:manage -- list
pnpm content:curriculum:manage -- review --level B1 --version 1
pnpm content:curriculum:manage -- publish --level B1 --version 1
pnpm content:curriculum:manage -- archive --level B1 --version 1
```

## Validation

Typecheck this package with:

```bash
pnpm -F @english.now/content check-types
```

The root `pnpm check` command runs Biome with `--write`, so it may modify files.

## Notes

- `generate-grammar-topics copy.ts` exists in `src/scripts`, but it is not wired to a package command. Prefer using `generate-grammar-topics.ts` unless the copy is intentionally needed.
- Scripts may write directly to the configured database. Verify `apps/server/.env` points to the intended environment before running generation or publish commands.

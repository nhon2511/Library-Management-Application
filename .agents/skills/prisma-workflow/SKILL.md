---
name: prisma-workflow
description: Safely change the Prisma PostgreSQL data model, migrations, queries, or seed data for this library backend.
---

# Prisma Workflow

Use when a task changes `prisma/schema.prisma`, database queries, migrations, or `prisma/seed.ts`.

## Workflow

- Inspect related models, relations, indexes, enums, and existing migration state before editing.
- Keep Prisma field names in the established camelCase style and preserve database mappings where present.
- Consider uniqueness, nullability, referential behavior, indexes, soft-delete semantics, and transaction requirements.
- Reuse the shared client from `src/config/database.ts`; never create a new client per request or module.
- After schema changes, run `npm run db:generate` and create a development migration with `npm run db:migrate`.
- Update seed data only when required and keep it deterministic and safe to rerun.
- Use `npm run db:deploy` only for applying already-reviewed migrations in a deploy environment.
- Never run `npm run db:reset` without explicit confirmation because it can destroy local data.

## Verification

Run `npm run build` and relevant lint/format checks. Review the generated migration and verify affected service queries, constraints, and API behavior. Do not commit secrets or database dumps.

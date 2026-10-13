---
name: release-check
description: Validate a backend change before merge or deployment, including build quality, Prisma readiness, configuration, security, and repository cleanliness.
---

# Release Check

Use before merging a feature/fix or preparing a deployment. Inspect the diff and `git status` first.

## Checklist

- Confirm the change is scoped and no `.env`, credentials, dumps, `dist/`, or generated noise is staged.
- Run `npm run build`, `npm run lint`, and `npm run format:check`.
- If Prisma changed, run `npm run db:generate`, review the migration, and verify deployment ordering.
- Check required environment variables and update `.env.example` when configuration changed.
- Check API compatibility, authentication/RBAC, validation, error responses, and production logging.
- Run the configured test command if available; otherwise record that no test runner is configured.
- Review the final diff and commit message using the repository's Conventional Commits style.

Never apply destructive database commands or deploy externally as part of this checklist without explicit authorization.

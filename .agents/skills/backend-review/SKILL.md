---
name: backend-review
description: Review changes in this Express/TypeScript backend for architecture, correctness, maintainability, validation, error handling, and project conventions.
---

# Backend Review

Use for reviewing backend changes before merge. Read `AGENTS.md` first and inspect the complete changed files plus their direct callers.

## Review focus

- Confirm the module follows `routes -> controller -> service -> schema` where applicable.
- Ensure controllers remain thin and services own business logic and Prisma access.
- Check request body, query, and params validation with Zod.
- Check `asyncHandler`, `ApiResponse`, and `ApiError` usage and status codes.
- Check authentication, RBAC, soft-delete behavior, pagination, and transaction boundaries.
- Check TypeScript strictness, unused symbols, unsafe casts, and unnecessary duplication.
- Check that secrets, passwords, tokens, and sensitive database details are not logged.

## Verification

Run the relevant checks, normally:

```bash
npm run build
npm run lint
npm run format:check
```

Report findings with severity, file/line, impact, and a concrete fix. Separate confirmed defects from suggestions. If no defects are found, state what was checked and any unverified areas.

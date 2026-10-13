---
name: api-feature
description: Add or modify a REST API feature in this Express/TypeScript library backend using its module, validation, response, authentication, and error-handling conventions.
---

# API Feature

Use when adding or changing an API endpoint. First identify the owning module and inspect a similar existing endpoint.

## Implementation rules

- Keep route registration in the module route file and preserve the `/api/v1` prefix from `src/app.ts`.
- Put request parsing and response orchestration in the controller; put business rules and Prisma calls in the service.
- Add or update a Zod schema for body, query, or params and attach `validate` before the controller.
- Decide explicitly whether the endpoint is public or requires `authenticate` and `authorize`.
- Use `ApiResponse` for success and typed `ApiError` subclasses for expected failures.
- Wrap asynchronous controller handlers with `asyncHandler`.
- Preserve pagination and response shapes used by neighboring endpoints.
- Update `.env.example`, Prisma schema, migrations, or documentation only when the feature actually requires it.

## Completion checks

Run `npm run build`, `npm run lint`, and `npm run format:check`. If an API test harness exists, exercise success, validation failure, unauthorized/forbidden, not-found, conflict, and unexpected-error paths as applicable.

---
name: testing
description: Design and add tests for this Express/TypeScript library backend, while respecting its current lack of a configured test runner.
---

# Testing

Use when adding tests, fixing a bug that needs regression coverage, or evaluating a new API feature.

## Current project state

There is currently no test script or discovered test suite in `package.json`. Do not silently add a testing framework or dependencies unless the task authorizes that setup.

## Test strategy

- Prefer unit tests for pure utilities and service business rules where dependencies can be isolated.
- Prefer integration/API tests for middleware composition, authentication, validation, response shapes, and database behavior.
- Cover success, invalid input, authentication/authorization failures, not-found/conflict cases, and important boundary values.
- Keep test data isolated and never use production credentials or a production database.
- When a test runner is introduced, add an explicit `npm test` script and document setup in `AGENTS.md`.

## Completion

Run the configured test command if one exists, plus `npm run build`, `npm run lint`, and `npm run format:check`. If tests cannot run because the project has no runner, report that limitation instead of claiming success.

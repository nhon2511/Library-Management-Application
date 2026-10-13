---
name: bug-fix
description: Diagnose and fix a confirmed defect in this Express/TypeScript backend with minimal scope and regression protection.
---

# Bug Fix

Use when a defect is reported or reproduced. Preserve unrelated working-tree changes and inspect `git status` before editing.

## Workflow

1. Reproduce the behavior or identify the strongest available evidence.
2. Trace the request from route and middleware through controller, service, Prisma, and error handler as relevant.
3. State the root cause before changing code.
4. Make the smallest fix that restores the intended behavior without bypassing validation or security.
5. Add or update a regression test when a test setup exists; otherwise document the missing test infrastructure.
6. Run `npm run build`, `npm run lint`, and `npm run format:check`, plus targeted checks.

Do not hide errors, broaden permissions, reset the database, or rewrite unrelated files to make the symptom disappear.

---
name: security-review
description: Audit Express API changes for authentication, authorization, validation, secrets, data exposure, and common backend security regressions.
---

# Security Review

Use for auth changes, new endpoints, middleware changes, database access changes, or an explicit security audit. Read `AGENTS.md` and inspect the complete request path.

## Audit areas

- Verify JWT access/refresh handling, cookie settings, expiry, and secret configuration.
- Verify every protected action has the correct `authenticate` and `authorize` middleware.
- Check object-level authorization so a valid user cannot access another user's records.
- Check Zod validation, safe parsing of query values, pagination limits, and uncontrolled sort fields.
- Check password hashing, token invalidation, and that credentials/tokens are absent from responses and logs.
- Check CORS, Helmet, rate limiting, error responses, and production error disclosure.
- Check Prisma filters for soft-deleted records and unsafe trust of client-provided IDs or roles.

## Output

Report only evidence-backed findings with severity, attack scenario, affected location, and remediation. Distinguish exploitable issues from hardening suggestions. Run the relevant build and lint checks; do not weaken security controls merely to make tests pass.

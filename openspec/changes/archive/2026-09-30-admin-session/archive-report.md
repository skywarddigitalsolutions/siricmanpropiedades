# Archive report: admin-session (roadmap feature 5)

Archived 2026-09-30.

## Delivered

| PR | Repo | Content |
|----|------|---------|
| back #19 | back | Non-rotating `GET /api/auth/me`; `API_INTERNAL_URL` on the compose `web` service; runbook section 7 |
| front #6 | front | OpenSpec init + planning artifacts |
| front #7 | front | Server-only API client with `X-Forwarded-For` forwarding, session cookies, role gate, `src/proxy.ts`, `(site)` route group |
| front #8 | front | Login + MFA verify (Server Actions), shared form primitives; fix: wrong MFA code vs invalid mfaToken distinguished by exact back message |
| front #9 | front | First-time MFA enrollment (password → QR via `uqr` → confirm → backup codes) |
| front #10 | front | `/admin` landing, logout, error boundary; fixes: no cookie writes from a Server Component render path; backup codes screen now renders (setup cookie cleared by `finishEnrollmentAction` after acknowledgement) |

## Verification at close

- Front: 162/162 Vitest tests, lint, `tsc --noEmit`, build.
- Back: 399/399 Jest tests, lint, `tsc`, build.
- Real end-to-end runs (throwaway Postgres, built back, `next start`, curl + Playwright with real TOTP codes): manager login, user-role denial, expired/forbidden notices, admin MFA enrollment with 10 backup codes, MFA-verified login, logout with server-side revocation, no bearer token in HTML/bundles.

## Specs promoted

- `openspec/specs/admin-session/spec.md` (front).
- `auth-session-read` promoted to `back-siricmanpropiedades/openspec/specs/auth-session-read/spec.md`.

## Deviations

- `src/proxy.ts` instead of `middleware.ts` (Next.js 16 rename).
- `uqr` instead of `qrcode` (no CLI dependency tree).
- Enrollment state split into `EnableMfaState` / `ConfirmMfaState`; `finishEnrollmentAction` added.

## Open follow-ups

- Post-deploy: two-IP throttle independence check (back runbook section 7) and a full MFA login in production.
- Admin visuals were built with the public-site tokens because the Claude Design admin project was unavailable (HTTP 503); align in feature 6.
- `/auth/me` counts against the global 20 req/min throttle; revisit if feature 6 pages fetch more per render.

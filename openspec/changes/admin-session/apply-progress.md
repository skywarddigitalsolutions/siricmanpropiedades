# Apply Progress: admin-session

## Change: `admin-session`
## Mode: Strict TDD (RED → GREEN → REFACTOR)

## Completed Work Units

### Phase 1 — Back: `GET /auth/me`, compose env, runbook (Slice 1, PR 1)

Repo: `back-siricmanpropiedades`, branch `feat/auth-me` (fresh from `main`).

- [x] 1.1 RED — `auth.service.spec.ts`: failing `toSessionUser` tests
- [x] 1.2 GREEN — `auth.service.ts`: `toSessionUser`, `buildSessionResponse`/`checkAuthStatus` refactored
- [x] 1.3 RED — `auth.controller.spec.ts` created (new file): failing `me` route tests
- [x] 1.4 GREEN — `auth.controller.ts`: `GET me` added
- [x] 1.5 Verify — `jwt.strategy.spec.ts` (read-only) confirmed to already cover scope/revoked/missing/inactive cases; full `npm test` green
- [x] 1.6 Config — `deploy/compose.yml`: `web.environment.API_INTERNAL_URL: http://api:3000`
- [x] 1.7 Docs — `deploy/README.md`: section "7. Panel de administración: sesión de administradores" added (neutral Spanish, verbatim from design.md)
- [x] 1.8 Verify (slice 1 gate) — all four back gate commands passed

**Status: 8/8 Phase 1 tasks complete.**

### Phase 2 — Front: transport & session foundation (Slice 2, PR 2)

Repo: `front-siricmanpropiedades`, branch `feat/admin-session-foundation` (from `main`).

- [x] 2.1 Setup — `server-only` added to `package.json`
- [x] 2.2 Setup — `resolve.alias` for `server-only` → stub added to `vitest.config.ts`
- [x] 2.3 Create — `src/test/stubs/server-only.ts` (empty module stub)
- [x] 2.4 Create — `src/test/next-server.ts` (`createCookieStore`, `mockRequestHeaders`, `RedirectError`, `expectRedirect`)
- [x] 2.5 RED / 2.6 GREEN — `src/lib/api/client-ip.ts` + test: `getClientIp(headers)`
- [x] 2.7 RED / 2.8 GREEN — `src/lib/api/client.ts` + test: `apiFetch`, `ApiError`
- [x] 2.9 RED / 2.10 GREEN — `src/lib/api/auth.ts` + test: typed endpoint functions, type guards
- [x] 2.11 Create — `src/lib/session/cookie-names.ts` (no `server-only`, read by `proxy.ts`)
- [x] 2.12 RED / 2.13 GREEN — `src/lib/session/cookies.ts` + test: `cookieOptions`, get/set/clear helpers
- [x] 2.14 RED / 2.15 GREEN — `src/lib/session/roles.ts` + test: `canAccessPanel`
- [x] 2.16 RED / 2.17 GREEN — `src/proxy.ts` + test: the four ADR-3 ordered rules
- [x] 2.18 Refactor — `src/app/layout.tsx`: public chrome removed
- [x] 2.19 Create — `src/app/(site)/layout.tsx`: public chrome
- [x] 2.20 Move — `page.tsx`/`page.module.css`/`page.test.tsx` moved into `(site)/` unchanged (via `git mv`, no content diff); full suite + manual `npm run build` route table confirm `/` renders unchanged
- [x] 2.21 Docs — `README.md`: "Environment variables" section (`API_INTERNAL_URL`, no `JWT_SECRET`, admin routes note)
- [x] 2.22 Verify (slice 2 gate) — all four front gate commands passed

**Status: 22/22 Phase 2 tasks complete.** Phases 3–5 not started — out of scope for this apply batch (orchestrator scoped this batch to Phase 2 only).

## TDD Cycle Evidence

### Phase 1 (back)

| Task | RED (observed) | GREEN (observed) | REFACTOR |
|---|---|---|---|
| 1.1–1.2 `toSessionUser` | `npm test -- auth.service.spec.ts` → TS2339 `Property 'toSessionUser' does not exist`, suite failed to run | `npm test -- auth.service.spec.ts` → 18 passed, 18 total | `buildSessionResponse`/`checkAuthStatus` now spread `toSessionUser(user)`; full `npm test` 39 suites/399 tests green, no behavior change |
| 1.3–1.4 `GET /me` | `npm test -- auth.controller.spec.ts` → TS2339 `Property 'me' does not exist on type 'AuthController'` (×3), suite failed to run | `npm test -- auth.controller.spec.ts` → 2 passed, 2 total | None needed; controller method matches ADR-1 exactly |

### Phase 2 (front)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 2.5–2.6 | `src/lib/api/client-ip.test.ts` | Unit (node) | N/A (new) | ✅ `Cannot find module './client-ip'`, 0 tests ran | ✅ `npx vitest run` → 1 file, 9/9 passed | ✅ 9 cases (single IP, chain-rightmost, whitespace, IPv6, `::ffff:`, invalid, injected, missing, empty) | ➖ None needed |
| 2.7–2.8 | `src/lib/api/client.test.ts` | Unit (node) | N/A (new) | ✅ `Cannot find module './client'`, 0 tests ran (module resolution failure on all 16 cases) | ✅ `npx vitest run` → 1 file, 16/16 passed | ✅ 16 cases (URL composition ×2, missing env, auth header ×2, XFF ×2, cache, 2xx JSON, empty 201, 401/400/429/500 via `it.each`, network failure, timeout) | ➖ None needed |
| 2.9–2.10 | `src/lib/api/auth.test.ts` | Unit (node), mocked `apiFetch` | N/A (new) | ✅ `Cannot find module './auth'`, 0 tests ran | ✅ `npx vitest run` → 1 file, 8/8 passed | ➖ Single call-shape per endpoint (structural, one path/method/body per function); type guards get 3 cases each across all 3 `LoginResponse` shapes | ➖ None needed |
| 2.12–2.13 | `src/lib/session/cookies.test.ts` | Unit (node), cookie-store fake | N/A (new) | ✅ `Cannot find module './cookies'`, 0 tests ran | ✅ `npx vitest run` → 1 file, 10/10 passed | ✅ dev vs. production `secure`; 3 distinct max-ages (3600/300/900); get-present vs. get-absent; single vs. all-three clear | ➖ None needed |
| 2.14–2.15 | `src/lib/session/roles.test.ts` | Unit, pure | N/A (new) | ✅ transform error: `Cannot find module './roles'`, 0 tests ran | ✅ `npx vitest run` → 1 file, 7/7 passed | ✅ 7 cases (admin, manager, both, user, empty, unknown, mixed-with-unknown) | ➖ None needed |
| 2.16–2.17 | `src/proxy.test.ts` | Unit (node), real `NextRequest`/`NextResponse` | N/A (new) | ✅ `Cannot find module './proxy'`, 0 tests ran | ✅ `npx vitest run` → 1 file, 9/9 passed | ✅ 9 cases (unauth redirect, authed-on-login redirect, `reason=expired`/`forbidden` ×2 via `it.each`, 3 public-path pass-throughs via `it.each`, authed-on-protected pass-through, matcher config) | ➖ None needed |
| 2.18–2.20 | `src/app/(site)/page.test.tsx` (moved, unchanged) | Component (jsdom) | ✅ Full suite green before the move (68/68 after Phase 2 units above) | N/A — approval-style move, not new behavior; the existing smoke test is the safety net | ✅ `npm test` → 11 files, 68/68 passed after the move; `npm run build` → route table still shows `┌ ○ /` unchanged | N/A | N/A |

### Test Summary (Phase 2)
- **Total tests written**: 59 (9 + 16 + 8 + 10 + 7 + 9, across 6 new test files)
- **Total tests passing**: 59/59 (new) + 9/9 (pre-existing, unaffected) = 68/68 full suite
- **Layers used**: Unit (58, mostly Node-environment with mocked `next/headers`/`next/navigation`), Component (1, the moved `page.test.tsx`, unaffected)
- **Approval tests** (refactoring): None — the route-group move (2.18–2.20) preserved the existing smoke test unchanged as its regression guard; no new approval test was needed since no behavior changed
- **Pure functions created**: 2 (`getClientIp`, `canAccessPanel`)

## Work Unit Evidence (Phase 2)

| Evidence | Value |
|---|---|
| Focused test command and exact result | Per-unit: `npx vitest run src/lib/api/client-ip.test.ts` (9/9), `src/lib/api/client.test.ts` (16/16), `src/lib/api/auth.test.ts` (8/8), `src/lib/session/cookies.test.ts` (10/10), `src/lib/session/roles.test.ts` (7/7), `src/proxy.test.ts` (9/9). Full slice: `npm test` → 11 files, 68/68 passed |
| Runtime harness command/scenario and exact result | `npm run build` (Next 16, Turbopack) → `Compiled successfully`, TypeScript pass, static generation 4/4, route table shows `┌ ○ /` and `└ ○ /_not-found` unchanged plus `ƒ Proxy (Middleware)` now present. No `/admin` UI exists yet in this slice, so there is no live-server manual walkthrough to run (per the tasks.md-designated runtime harness for this unit); the build's route/proxy detection is the closest available runtime check |
| Rollback boundary | Six independent commits on `feat/admin-session-foundation`, each revertible alone: `5c16bcd` (test scaffolding), `b11e248` (API transport client), `7dfc646` (typed auth endpoints), `2c05366` (session cookies + role gate), `c45114d` (proxy), `fb9a0f9` (route-group move), `da8023d` (README docs). `/admin` does not exist yet, so the public site (`/`) is untouched by any of these; reverting any subset leaves the rest self-consistent except that `client.ts`/`auth.ts`/`cookies.ts` depend on `client-ip.ts`/`client.ts`/`cookie-names.ts` respectively (revert in reverse commit order if reverting more than the last commit) |

## Slice 2 Gate — Full Verification (task 2.22)

| Command | Observed result |
|---|---|
| `npm test` | 11 test files passed, 68 tests passed |
| `npm run lint` | `eslint` — no output, no errors |
| `npx tsc --noEmit` | No output, no errors |
| `npm run build` | `next build` (Turbopack) — compiled successfully, TypeScript pass, static generation 4/4, route table: `/` and `/_not-found` static, `Proxy (Middleware)` present |

## Files Changed (front repo, `feat/admin-session-foundation` branch)

| File | Action | What Was Done |
|---|---|---|
| `package.json`, `package-lock.json` | Modified | Added `server-only` |
| `vitest.config.ts` | Modified | `resolve.alias` for `server-only` → `src/test/stubs/server-only.ts` |
| `src/test/stubs/server-only.ts` | Created | Empty module stub |
| `src/test/next-server.ts` | Created | `createCookieStore`, `mockRequestHeaders`, `RedirectError`, `expectRedirect` |
| `src/lib/api/client-ip.ts` (+ test) | Created | `getClientIp(headers)` — rightmost validated IP, warns without leaking the header |
| `src/lib/api/client.ts` (+ test) | Created | `apiFetch<T>`, `ApiError` — bearer auth, XFF forwarding, no-store, 10s timeout, error mapping |
| `src/lib/api/auth.ts` (+ test) | Created | `login`, `verifyMfa`, `enableMfa`, `confirmMfa`, `logout`, `getMe`, `isMfaRequired`, `isMfaSetupRequired` |
| `src/lib/session/cookie-names.ts` | Created | `SESSION_COOKIE`, `MFA_PENDING_COOKIE`, `SETUP_PENDING_COOKIE`, `ADMIN_COOKIE_PATH`, three max-ages (no `server-only`) |
| `src/lib/session/cookies.ts` (+ test) | Created | `cookieOptions`, get/set/clear helpers for all three cookies |
| `src/lib/session/roles.ts` (+ test) | Created | `PANEL_ROLES`, `canAccessPanel` |
| `src/proxy.ts` (+ test) | Created | Next 16 route-protection proxy, ADR-3's four ordered rules |
| `src/app/layout.tsx` | Modified | Removed `Header`/`Footer`/`WhatsAppButton`; kept `<html>`/`<body>`/fonts/`globals.css`/metadata |
| `src/app/(site)/layout.tsx` | Created | Public chrome (`Header`, `Footer`, `WhatsAppButton`) |
| `src/app/(site)/page.tsx`, `page.module.css`, `page.test.tsx` | Moved (`git mv`, unchanged) | From `src/app/` — URL (`/`) unaffected |
| `README.md` | Modified | "Environment variables" section (`API_INTERNAL_URL`), "no `JWT_SECRET`" note, "Admin routes" note |

## Commits (front repo, not pushed)

- `5c16bcd` — `test(admin-session): add server-only test scaffolding for Vitest`
- `b11e248` — `feat(admin-session): add server-only API transport client`
- `7dfc646` — `feat(admin-session): add typed auth API endpoint functions`
- `2c05366` — `feat(admin-session): add session cookie helpers and role gate`
- `c45114d` — `feat(admin-session): add the /admin route-protection proxy`
- `fb9a0f9` — `refactor(site): move the public chrome into a (site) route group`
- `da8023d` — `docs(front): document API_INTERNAL_URL and the admin routes`

`git diff --stat main...HEAD -- . ':!openspec' ':!package-lock.json'`: 23 files changed, 1238 insertions(+), 10 deletions(-).

## Deviations from Design

None — implementation matches `design.md` ADR-2 through ADR-7 and ADR-10 exactly, including the `proxy.ts` naming per ADR-3's verified Next 16 evidence (re-confirmed in this apply session by reading the installed `node_modules/next/dist/docs/.../proxy.md` and `cookies.md` directly: `middleware` is deprecated and renamed to `proxy` in v16.0.0, `cookies()` is async, and deletion is `set(name, value, { maxAge: 0 })` on a matching path — all as ADR-2/ADR-3 state).

One implementation choice not fully spelled out in `design.md`, made consistently with ADR-4/ADR-5's intent: `getClientIp(headers: Headers)` is a **pure** function taking a `Headers` object (matching the ADR-4 `Choice` line's exact signature), and `apiFetch` is the one caller that resolves `await headers()` from `next/headers` and passes it in — this keeps `client-ip.test.ts` mock-free (per ADR-10's "Node env, pure" testing-strategy row) while still satisfying "the API client sets outbound `X-Forwarded-For`."

## Issues Found

None. All four Phase 1 gate commands and all four Phase 2 gate commands passed on the first attempt after implementation; no pre-existing test failures were encountered as a baseline (front: 5 files/9 tests green before this batch; back: unaffected by this front-only batch).

## Workload / PR Boundary

- Mode: chained PR slice (`stacked-to-main`, per `auto-chain` resolution in `tasks.md`)
- Current work unit: Unit 2 / PR 2 (front: transport & session foundation)
- Boundary: starts from `main` (branch `feat/admin-session-foundation`, already checked out with Phase 1's docs commit on it), ends at commit `da8023d`
- Estimated review budget impact: **1,238 insertions + 10 deletions ≈ 1,248 authored changed lines — well over the 400-line default budget**, and higher than `tasks.md`'s own slice-2 forecast (proposal's slice plan estimated ~300–380 for this slice; the actual count is driven by Strict TDD's test volume: roughly 780 of the ~1,180 non-README/non-config lines are test code across 6 new test files, none of which can be cut without violating the Strict TDD Mode contract or the "budget is not code-golf" rule in `work-unit-commits/SKILL.md`). This was implemented as one cohesive unit because: (a) the orchestrator's launch prompt explicitly scoped this apply batch to "Phase 2 ONLY... Do not start Phase 3," matching `tasks.md`'s own PR-2 boundary exactly; (b) every file in this slice is a load-bearing dependency of the others (`client.ts` depends on `client-ip.ts`; `cookies.ts`/`auth.ts` depend on the transport client; `proxy.ts` depends on `cookie-names.ts`; the route-group move is required before Phase 3 can add `src/app/admin/**`) — there is no smaller independently-shippable slice within Phase 2 without leaving the transport or session layer half-built. **Recommendation: `size:exception` for PR 2**, or the orchestrator may choose to further split PR 2 into two chained sub-PRs (e.g. "transport" vs. "session + proxy + route-group move") before opening it — that decision is deferred back to the orchestrator/user per the workload-guard rule, since splitting further was not part of the assigned scope for this batch and doing so unasked would risk breaking the seven already-committed, already-verified work units.

### Phase 3 — Front: login + MFA verify (Slice 3, PR 3)

Repo: `front-siricmanpropiedades`, branch `feat/admin-session-login` (fresh from `main` after PRs 1–2 merged).

- [x] 3.1 RED / 3.2 GREEN — `src/components/admin/auth/messages.ts` + test: `AuthErrorCode`/`SessionNotice` → neutral-Spanish message mapping (ADR-8's table)
- [x] 3.3 RED / 3.4 GREEN — `src/lib/session/complete-session.ts` + test: `completeSession` (shared role gate for login + MFA verify)
- [x] 3.5 RED / 3.6 GREEN — `src/components/admin/forms/{SubmitButton,FormAlert,TextField}` + tests: shared accessible form primitives
- [x] 3.7 Create — `src/components/admin/auth/AuthCard/AuthCard.tsx` (no test, presentational) + `src/app/admin/(auth)/layout.tsx`
- [x] 3.8 Create — `src/app/admin/layout.tsx` (noindex metadata, admin shell)
- [x] 3.9 RED / 3.10 GREEN — `src/components/admin/auth/LoginForm/LoginForm.tsx` + test
- [x] 3.11 RED / 3.12 GREEN — `src/app/admin/(auth)/login/actions.ts` + test: `loginAction`
- [x] 3.13 Create — `src/app/admin/(auth)/login/page.tsx`
- [x] 3.14 RED / 3.15 GREEN — `src/components/admin/auth/MfaVerifyForm/MfaVerifyForm.tsx` + test
- [x] 3.16 RED / 3.17 GREEN — `src/app/admin/(auth)/mfa/actions.ts` + test: `verifyMfaAction`
- [x] 3.18 Create — `src/app/admin/(auth)/mfa/page.tsx`
- [x] 3.19 Verify (slice 3 gate) — all four front gate commands passed

**Status: 19/19 Phase 3 tasks complete.**

## TDD Cycle Evidence (Phase 3)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 3.1–3.2 | `src/components/admin/auth/messages.test.ts` | Unit, pure | N/A (new) | ✅ `Failed to resolve import "./messages"` | ✅ `npx vitest run` → 1 file, 9/9 passed | ✅ 9 cases (7 error codes + 2 session notices, `it.each`) | ➖ None needed |
| 3.3–3.4 | `src/lib/session/complete-session.test.ts` | Unit (node), mocked `next/headers` + `@/lib/api/auth` | N/A (new) | ✅ `Cannot find module './complete-session'` | ✅ `npx vitest run` → 1 file, 3/3 passed | ✅ 3 cases (role gate passes; role gate fails + logout succeeds; role gate fails + logout throws, swallowed) | ➖ None needed |
| 3.5–3.6 | `SubmitButton.test.tsx`, `FormAlert.test.tsx`, `TextField.test.tsx` | Component (jsdom) | N/A (new) | ✅ 3× `Failed to resolve import` | ✅ `npx vitest run` → 3 files, 6/6 passed (1 fix: `FormAlert` test switched from `getByRole("alert", {name})` to `toHaveTextContent`, since jsdom's accessible-name computation for `role="alert"` did not pick up text content) | ✅ SubmitButton: idle + pending states; TextField: with/without error | ➖ None needed |
| 3.7–3.8 | — (no test; presentational/layout, matches design.md's Testing Strategy table) | N/A | N/A (new) | N/A | ✅ Verified via the slice-3 `npm run build` route table | N/A | N/A |
| 3.9–3.10 | `LoginForm.test.tsx` | Component (jsdom) | N/A (new) | ✅ `Failed to resolve import "./LoginForm"` | ✅ `npx vitest run` → 1 file, 4/4 passed (1 fix: the "never echoes password" case needed the username field filled too, since native `required` validation blocked submission) | ✅ labeled fields + autocomplete; mapped error alert; pending disables submit; password-leak regression guard | ➖ None needed |
| 3.11–3.12 | `actions.test.ts` (login) | Unit (node), mocked `next/headers`/`next/navigation`/`@/lib/api/auth` (partial: only `login`/`logout` replaced, real `isMfaRequired`/`isMfaSetupRequired` kept via `importOriginal`) | N/A (new) | ✅ `Cannot find module './actions'` | ✅ `npx vitest run` → 1 file, 9/9 passed | ✅ 9 cases: full session admin/manager; full session user (no-access); mfaRequired; mfaSetupRequired; 401/400/429 error mapping (`it.each`); ApiError(0); empty fields | ➖ None needed |
| 3.14–3.15 | `MfaVerifyForm.test.tsx` | Component (jsdom) | N/A (new) | ✅ `Failed to resolve import "./MfaVerifyForm"` | ✅ `npx vitest run` → 1 file, 5/5 passed | ✅ autocomplete hint; 6-digit TOTP; 10-char backup code; mapped error alert; pending disables submit | ➖ None needed |
| 3.16–3.17 | `actions.test.ts` (mfa) | Unit (node), same mocking pattern as login actions | N/A (new) | ✅ `Cannot find module './actions'` | ✅ `npx vitest run` → 1 file, 5/5 passed | ✅ 5 cases: missing cookie → redirect; correct code → session + redirect; wrong code (401) → keep cookie; other rejection → clear + redirect; role gate denies a user-role account | ➖ None needed |
| 3.18 | — (no test; async Server Component, per ADR-10) | N/A | N/A (new) | N/A | ✅ Verified via the slice-3 `npm run build` route table (`/admin/mfa` present) | N/A | N/A |

### Test Summary (Phase 3)
- **Total tests written**: 41 (9 + 3 + 6 + 4 + 9 + 5 + 5, across 9 new test files)
- **Total tests passing**: 41/41 (new) + 68/68 (Phase 1–2, unaffected) = 109/109 full suite
- **Layers used**: Unit (26: messages, complete-session, both actions.test.ts), Component (15: SubmitButton, FormAlert, TextField, LoginForm, MfaVerifyForm)
- **Approval tests** (refactoring): None — every Phase 3 file is new, no existing behavior was refactored
- **Pure functions created**: 2 (`getAuthErrorMessage`, `getSessionNoticeMessage`)

## Work Unit Evidence (Phase 3)

| Evidence | Value |
|---|---|
| Focused test command and exact result | Per-unit: `npx vitest run src/components/admin/auth/messages.test.ts` (9/9), `src/lib/session/complete-session.test.ts` (3/3), `src/components/admin/forms` (6/6 across 3 files), `src/components/admin/auth/LoginForm` (4/4), `"src/app/admin/(auth)/login/actions.test.ts"` (9/9), `src/components/admin/auth/MfaVerifyForm` (5/5), `"src/app/admin/(auth)/mfa/actions.test.ts"` (5/5). Full slice: `npm test` → 20 files, 109/109 passed |
| Runtime harness command/scenario and exact result | `npm run build` (Next 16, Turbopack) → `Compiled successfully`, TypeScript pass, static generation 6/6, route table shows `┌ ○ /`, `├ ○ /_not-found`, `├ ƒ /admin/login`, `└ ƒ /admin/mfa` plus `ƒ Proxy (Middleware)`. This confirms both new routes compile and are reachable through the real Next.js router. The tasks.md-designated runtime harness for this unit is a **manual** walkthrough against a real back `POST /auth/login`/`POST /auth/mfa/verify` (one scratch account per role) — deferred to the orchestrator/user since it requires a running back instance and real accounts, which this apply session does not have authorization or infrastructure to start; the build's route/compile check is the automatable proof available in this session |
| Rollback boundary | Six independent commits on `feat/admin-session-login`, each revertible alone: message mapping, session-completion role gate, shared form primitives, admin shell + auth card layout, login form/page/action, MFA verify form/page/action. `/admin` itself does not exist yet (Phase 5), so no already-deployed route is affected by reverting any subset; reverting the role-gate or form-primitives commits would break the login/MFA commits that depend on them (revert in reverse commit order if reverting more than the last commit) |

## Slice 3 Gate — Full Verification (task 3.19)

| Command | Observed result |
|---|---|
| `npm test` | 20 test files passed, 109 tests passed |
| `npm run lint` | `eslint` — no output, no errors |
| `npx tsc --noEmit` | No output, no errors (required one `npx next typegen` refresh first: a stale `.next/dev/types/validator.ts` left over from an earlier local `next dev` run in this working tree did not yet know about the new `/admin/login`/`/admin/mfa` routes; this is a generated-artifact freshness issue, not a source defect — the same regeneration also happens as part of `npm run build`) |
| `npm run build` | `next build` (Turbopack) — compiled successfully, TypeScript pass, static generation 6/6, route table: `/`, `/_not-found` static; `/admin/login`, `/admin/mfa` dynamic; `Proxy (Middleware)` present |

## Files Changed (Phase 3, front repo, `feat/admin-session-login` branch)

| File | Action | What Was Done |
|---|---|---|
| `src/components/admin/auth/messages.ts` (+ test) | Created | `AuthErrorCode`/`SessionNotice` → neutral-Spanish message mapping |
| `src/lib/session/complete-session.ts` (+ test) | Created | `completeSession` — shared role gate for login + MFA verify |
| `src/components/admin/forms/SubmitButton/*` (+ test) | Created | `useFormStatus`-driven pending/disabled/`aria-busy` button |
| `src/components/admin/forms/FormAlert/*` (+ test) | Created | `role="alert"` error/notice text |
| `src/components/admin/forms/TextField/*` (+ test) | Created | Labeled input wiring `aria-invalid`/`aria-describedby` |
| `src/components/admin/auth/AuthCard/*` | Created | Presentational centered-card shell (no test) |
| `src/app/admin/(auth)/layout.tsx` | Created | Wraps auth screens in `AuthCard` |
| `src/app/admin/layout.tsx` (+ `layout.module.css`) | Created | `robots: noindex`, admin shell background |
| `src/components/admin/auth/LoginForm/*` (+ test) | Created | `useActionState`-driven login form; password never echoed from state |
| `src/app/admin/(auth)/login/actions.ts` (+ test) | Created | `loginAction` — branches on the three `LoginResponse` shapes |
| `src/app/admin/(auth)/login/page.tsx` | Created | Reads `searchParams.reason`, renders `<LoginForm>` with a notice |
| `src/components/admin/auth/MfaVerifyForm/*` (+ test) | Created | Free-text 6–10 char code field, TOTP or backup code |
| `src/app/admin/(auth)/mfa/actions.ts` (+ test) | Created | `verifyMfaAction` — 401 keeps the pending cookie, other rejections clear + redirect |
| `src/app/admin/(auth)/mfa/page.tsx` | Created | Requires the mfa-pending cookie, renders `<MfaVerifyForm>` |

## Commits (front repo, `feat/admin-session-login`, not pushed)

- `6cf9d7c` — `feat(admin-session): add auth error and session-notice message mapping`
- `c77453c` — `feat(admin-session): add the shared session-completion role gate`
- `6121586` — `feat(admin-session): add shared accessible form primitives`
- `364c027` — `feat(admin-session): add the admin route shell and auth card layout`
- `de967cd` — `feat(admin-session): add the login screen, form, and Server Action`
- `c0aed96` — `feat(admin-session): add the MFA verification screen and Server Action`

`git diff --stat main...HEAD -- . ':!openspec' ':!package-lock.json'`: 30 files changed, 1,268 insertions(+). (`main` already contains Phases 1–2, merged via PRs 1–2 before this branch was cut, so this diff is Phase 3 alone.)

## Deviations from Design (Phase 3)

One resolved discrepancy between `design.md`'s ADR-8 mapping table and `tasks.md`'s task 3.16, noted here for `sdd-verify`: ADR-8's table states "verify/confirm 401 or 400 → invalid-code" as a single bucket, shown inline with a link back to login. Task 3.16, however, and `specs/admin-session/spec.md`'s "MFA Verification" requirement, describe two *different* outcomes for a rejected verify call: a wrong code (cookie kept, inline error) versus an expired/invalid/consumed `mfaToken` (cookie cleared, hard redirect to `/admin/login`). Since both scenarios can plausibly surface as different back HTTP statuses (a guard-level `401` for a bad/expired token vs. a service-level `400` for a wrong-but-well-formed code — consistent with this codebase's existing back convention of guards throwing `401`), `verifyMfaAction` implements the finer split literally from task 3.16: **`401` → `invalid-code` (mfaToken cookie kept for retry)**; **any other rejection (`400`, `429`, `0`, 5xx) → clear the cookie and redirect to `/admin/login`**. This is a genuine implementation choice made in the absence of the back's actual `/auth/mfa/verify` status-code contract (out of scope for this front-only apply batch) — `sdd-verify` should confirm the back's actual status codes for "wrong code" versus "token invalid/expired/consumed" against this mapping once the back endpoint is available to test against.

Everything else in Phase 3 matches `design.md` ADR-6/ADR-7/ADR-8/ADR-10 as written. `LayoutProps<T>`/`PageProps<T>` typed-route helpers (used by the pre-existing root `layout.tsx`) were deliberately **not** used for the new `/admin/**` layouts and pages; plain hand-written prop types were used instead, because Next's generated `.next/types/routes.d.ts` is only refreshed by `next build`/`next dev`/`next typegen`, and the mandated gate order (`tsc` before `build`) would otherwise fail on stale route unions the first time a new route is added. This is a typing-mechanism choice, not a behavioral deviation.

## Issues Found (Phase 3)

None blocking. Two minor test-authoring fixes during GREEN (documented in the TDD Cycle Evidence table above): `FormAlert`'s accessible-name assertion needed to switch to `toHaveTextContent`, and `LoginForm`'s password-echo test needed the username field filled to pass native HTML5 validation. Both are test-only fixes, no production code was affected. `npx tsc --noEmit` needed a `next typegen` refresh due to a stale local `.next/dev/types/validator.ts` (see the Slice 3 Gate table); this is a local generated-artifact freshness issue, not a code defect, and resolves itself on any environment where `.next/dev` does not already exist (it is gitignored).

## Remaining Tasks

- [ ] Phase 4 (front, Slice 4/PR 4): MFA enrollment
- [ ] Phase 5 (front, Slice 5/PR 5): landing, logout, feature close
- [ ] 5.13–5.15 [Orchestrator-owned]: ROADMAP update, `sdd-archive`, spec promotion to back repo

## Status

8/8 Phase 1 + 22/22 Phase 2 + 19/19 Phase 3 tasks complete (49/59 total tasks across all five phases). Ready for the orchestrator to review PR 3's size (see Workload / PR Boundary below) and dispatch `sdd-apply` for Phase 4.

## Workload / PR Boundary (Phase 3)

- Mode: chained PR slice (`stacked-to-main`, per `auto-chain` resolution in `tasks.md`)
- Current work unit: Unit 3 / PR 3 (front: login + MFA verify)
- Boundary: starts from `main` (branch `feat/admin-session-login`, fresh checkout after PRs 1–2 merged), ends at commit `c0aed96`
- Estimated review budget impact: **1,268 insertions ≈ 1,268 authored changed lines — well over the 400-line default budget**, and in line with Phase 2's precedent (also over budget for the same reason: Strict TDD's test volume — roughly 650 of the ~1,268 lines are test code across 9 new test files). The orchestrator's launch prompt explicitly scoped this apply batch to "Phase 3 ONLY... Do not start Phase 4," matching `tasks.md`'s own PR-3 boundary. Every file in this slice composes into a single cohesive login+MFA-verify flow (messages → role gate → form primitives → shell → login → MFA verify), so there is no smaller independently-shippable slice within Phase 3 without leaving the flow half-built. **Recommendation: `size:exception` for PR 3** (consistent with the precedent set for PR 2), or the orchestrator may choose to split it into chained sub-PRs before opening it — deferred back to the orchestrator/user per the workload-guard rule.

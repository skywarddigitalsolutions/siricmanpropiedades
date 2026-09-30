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
| `src/app/admin/(auth)/mfa/actions.ts` (+ test) | Created, later fixed (`467d63a`) | `verifyMfaAction` — a `401` with message exactly `"Invalid code"` keeps the pending cookie; any other rejection clears the cookie and redirects to `/admin/login?reason=expired` |
| `src/app/admin/(auth)/mfa/page.tsx` | Created | Requires the mfa-pending cookie, renders `<MfaVerifyForm>` |

## Commits (front repo, `feat/admin-session-login`, not pushed)

- `6cf9d7c` — `feat(admin-session): add auth error and session-notice message mapping`
- `c77453c` — `feat(admin-session): add the shared session-completion role gate`
- `6121586` — `feat(admin-session): add shared accessible form primitives`
- `364c027` — `feat(admin-session): add the admin route shell and auth card layout`
- `de967cd` — `feat(admin-session): add the login screen, form, and Server Action`
- `c0aed96` — `feat(admin-session): add the MFA verification screen and Server Action`
- `467d63a` — `fix(admin-session): distinguish wrong MFA code from an invalid MFA token`

`git diff --stat main...HEAD -- . ':!openspec' ':!package-lock.json'`: 30 files changed, 1,315 insertions(+). (`main` already contains Phases 1–2, merged via PRs 1–2 before this branch was cut, so this diff is Phase 3 plus this fix.)

## Deviations from Design (Phase 3)

**RESOLVED** — the discrepancy below (originally flagged for `sdd-verify` after the initial Phase 3 apply) has been verified against the actual back endpoint and fixed:

ADR-8's mapping table states "verify/confirm 401 or 400 → invalid-code" as a single bucket. Task 3.16 and `specs/admin-session/spec.md`'s "MFA Verification" requirement describe two *different* outcomes for a rejected verify call: a wrong code (cookie kept, inline error) versus an expired/invalid/consumed `mfaToken` (cookie cleared, hard redirect to `/admin/login`). The initial Phase 3 apply guessed a status-code split (`401` → wrong code, anything else → token rejected) without back visibility.

Reading `back-siricmanpropiedades/src/auth/mfa/mfa.controller.ts` and `src/auth/auth.service.ts` directly shows the real contract: **`POST /api/auth/mfa/verify` returns `401` for both cases**, distinguished only by the exception *message*:
- `MfaController.verify` (`mfa.controller.ts:142`) throws `UnauthorizedException('Invalid code')` for a wrong TOTP/backup code, **before** the mfaToken is revoked — the token stays valid for a retry.
- `AuthService.resolveUserFromToken`/`verifyToken` (`auth.service.ts`) throw `UnauthorizedException` with one of `'Invalid or expired token'`, `'This token cannot be used for this operation'`, `'Token has been revoked'`, `'Token not valid'`, or `'User is not active'` when the mfaToken itself is rejected, before the code is even checked.

`verifyMfaAction` now distinguishes on the exact message, not just the status: **`401` with message exactly `"Invalid code"` → `invalid-code` (mfaToken cookie kept for retry)**; **any other `401` message, or any other status (`400`/`429`/`0`/5xx) → clear the cookie and redirect to `/admin/login?reason=expired`** (reusing the same notice the design already uses for an expired `setupToken`, task 4.9). `ApiError` already exposed the backend's `message` via the inherited `Error.message` (set from `client.ts`'s `extractErrorMessage`, which reads the NestJS exception filter's `body.message`) — no change to `ApiError` was needed, confirmed by the new RED tests passing once the action read `error.message`.

Fixed in commit `467d63a` — `fix(admin-session): distinguish wrong MFA code from an invalid MFA token`.

### Fix work unit: RED → GREEN evidence

| Evidence | Value |
|---|---|
| RED (observed) | Updated `src/app/admin/(auth)/mfa/actions.test.ts` (7 new/changed cases: the wrong-code test now uses the exact backend message `"Invalid code"`; a new `it.each` over the 5 token-rejection messages plus 1 non-401 case asserts `redirect("/admin/login?reason=expired")`) → `npx vitest run "src/app/admin/(auth)/mfa/actions.test.ts"` → 6/10 failed (the 5 token-rejection cases resolved to `{ error: "invalid-code" }` instead of rejecting with a redirect, and the non-401 case redirected to `/admin/login` instead of `/admin/login?reason=expired`) |
| GREEN (observed) | Updated `src/app/admin/(auth)/mfa/actions.ts` to match on `error.status === 401 && error.message === "Invalid code"` (previously `error.status === 401` alone) and to redirect to `/admin/login?reason=expired` (previously `/admin/login`) for every other rejection → `npx vitest run "src/app/admin/(auth)/mfa/actions.test.ts"` → 10/10 passed |
| Full slice test command and exact result | `npm test` → 20 files, 114/114 passed (109 before the fix + 5 net new) |
| Runtime harness command/scenario and exact result | `npm run build` (Turbopack) → compiled successfully, TypeScript pass, static generation 6/6, same route table as before (`/admin/login`, `/admin/mfa` dynamic, `Proxy (Middleware)` present) — this fix changes only Server Action branching logic, not routes, so the route table is unchanged. No live back to test the real message strings against was available in this session (out of scope); the message strings were taken directly from reading `back-siricmanpropiedades/src/auth/mfa/mfa.controller.ts` and `src/auth/auth.service.ts` verbatim, not inferred |
| Rollback boundary | One commit, `467d63a`, on top of the six Phase 3 commits; revertible alone without affecting anything else (it only touches `mfa/actions.ts` and its test) |
| ApiError message exposure | Confirmed, not extended: `ApiError extends Error` and `client.ts`'s `extractErrorMessage` already passes the NestJS exception filter's `body.message` into `super(message)`, so `error.message` was already accessible. No change to `src/lib/api/client.ts` was needed |

Gate re-run after the fix (same four commands as task 3.19):

| Command | Observed result |
|---|---|
| `npm test` | 20 test files passed, 114 tests passed |
| `npm run lint` | `eslint` — no output, no errors |
| `npx tsc --noEmit` | No output, no errors (no `next typegen` refresh needed this time — no routes changed) |
| `npm run build` | `next build` (Turbopack) — compiled successfully, TypeScript pass, static generation 6/6, same route table |

Everything else in Phase 3 matches `design.md` ADR-6/ADR-7/ADR-8/ADR-10 as written. `LayoutProps<T>`/`PageProps<T>` typed-route helpers (used by the pre-existing root `layout.tsx`) were deliberately **not** used for the new `/admin/**` layouts and pages; plain hand-written prop types were used instead, because Next's generated `.next/types/routes.d.ts` is only refreshed by `next build`/`next dev`/`next typegen`, and the mandated gate order (`tsc` before `build`) would otherwise fail on stale route unions the first time a new route is added. This is a typing-mechanism choice, not a behavioral deviation.

## Issues Found (Phase 3)

None blocking. Two minor test-authoring fixes during GREEN (documented in the TDD Cycle Evidence table above): `FormAlert`'s accessible-name assertion needed to switch to `toHaveTextContent`, and `LoginForm`'s password-echo test needed the username field filled to pass native HTML5 validation. Both are test-only fixes, no production code was affected. `npx tsc --noEmit` needed a `next typegen` refresh due to a stale local `.next/dev/types/validator.ts` (see the Slice 3 Gate table); this is a local generated-artifact freshness issue, not a code defect, and resolves itself on any environment where `.next/dev` does not already exist (it is gitignored). One genuine deviation was found and fixed after the fact (see "Deviations from Design" above): the initial `verifyMfaAction` guessed a status-code-only split for wrong-code vs. invalid-token; reading the actual back controller/service showed both cases return `401`, distinguished only by message, and the implementation was corrected in commit `467d63a`.

### Phase 5 — Front: landing, logout, feature close (Slice 5, PR 5)

Repo: `front-siricmanpropiedades`, branch `feat/admin-session-landing` (fresh from `main` after PRs 1–4 merged).

- [x] 5.1 RED — `src/lib/session/dal.test.ts`: failing tests for `getSessionToken`/`getCurrentUser` (no cookie → redirect login; 401 → redirect expired; disallowed role → best-effort logout + redirect forbidden; `ApiError(0)` → rethrown)
- [x] 5.2 GREEN — `src/lib/session/dal.ts`: `getSessionToken`, `getCurrentUser` (`React.cache`-wrapped). **Amended** after a defect found during task 5.12 (see Deviations below): removed the direct `cookies().set()` calls, redirect-only now, relying on the proxy to clear cookies per ADR-3
- [x] 5.3 RED / 5.4 GREEN — `src/components/admin/panel/{AdminHeader,LogoutButton}` + tests
- [x] 5.5 RED / 5.6 GREEN — `src/app/admin/(panel)/actions.ts` + test: `logoutAction`
- [x] 5.7 Create — `src/app/admin/(panel)/layout.tsx`
- [x] 5.8 Create — `src/app/admin/(panel)/page.tsx`
- [x] 5.9 Create — `src/app/admin/error.tsx`
- [x] 5.10 Static check — `.next/static/**/*.js` grepped for the three cookie names, `Bearer `, `API_INTERNAL_URL`, and the six server-only module path fragments: zero matches (twice — before and after the 5.2 fix rebuild)
- [x] 5.11 Verify (slice 5 gate) — all four front gate commands passed
- [x] 5.12 Manual end-to-end — executed against a real back build + real front `next start` build + a throwaway Docker Postgres; see the detailed pass/fail table below and in `tasks.md`

**Status: 12/12 Phase 5 tasks complete**, plus one defect found and fixed during 5.12 (task 5.2's amendment) and one defect found and **not** fixed — reported as a Risk — because it lives in already-merged Phase 4 code (see Deviations below).

## TDD Cycle Evidence (Phase 5)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 5.1–5.2 | `src/lib/session/dal.test.ts` | Unit (node), mocked `next/headers`/`next/navigation`/`@/lib/api/auth` | N/A (new) | ✅ `Cannot find module './dal'` | ✅ `npx vitest run` → 1 file, 7/7 passed | ✅ 7 cases (happy path; 401→expired; role-gate-forbidden with logout success; role-gate-forbidden with logout throwing, swallowed; `ApiError(0)` rethrown twice to prove no memoization masks it; token present/absent for `getSessionToken`) | ➖ None needed at GREEN time |
| 5.2 (amendment) | `src/lib/session/dal.test.ts` | Unit (node) | ✅ 7/7 (pre-fix) | ✅ Reproduced live against the real Next 16 runtime (`next start` + real back), not a synthetic unit RED — see Deviations; the 3 affected test cases were rewritten to spy on `store.set` and assert it is never called, which *would* fail against the pre-fix implementation (logically verified: the pre-fix code unconditionally called `clearAllSessionCookies()`, i.e. `store.set`, on both the 401 and role-gate-forbidden paths) | ✅ `npx vitest run src/lib/session/dal.test.ts` → 7/7 passed after the fix; real-runtime re-test (curl against `next start`) → 307 to `/admin/login?reason=expired`/`?reason=forbidden` instead of 500 | ✅ 3 cases re-verified against the real runtime: invalid/garbage cookie (`401` path), a real `user`-role token used as the session cookie (`role-gate-forbidden` path), both now redirect cleanly | ➖ None needed |
| 5.3–5.4 | `AdminHeader.test.tsx`, `LogoutButton.test.tsx` | Component (jsdom) | N/A (new) | ✅ 2× `Failed to resolve import` | ✅ `npx vitest run` → 2 files, 4/4 passed | ✅ AdminHeader: two different `userName` props; LogoutButton: submit + pending state | ➖ None needed |
| 5.5–5.6 | `src/app/admin/(panel)/actions.test.ts` | Unit (node), mocked `next/headers`/`next/navigation`/`@/lib/api/auth` | N/A (new) | ✅ `Cannot find module './actions'` | ✅ `npx vitest run` → 1 file, 3/3 passed | ✅ 3 cases (logout API success; logout API failure, still clears+redirects; no session cookie to begin with, logout never called) | ➖ None needed |
| 5.7–5.9 | — (no test; async Server Components + a client error boundary, per ADR-10) | N/A | N/A (new) | N/A | ✅ Verified via `npm run build`'s route table (`/admin` present) and via the real-runtime manual walkthrough (task 5.12) | N/A | N/A |

### Test Summary (Phase 5)
- **Total tests written**: 14 (7 + 4 + 3, across 4 new test files: `dal.test.ts`, `AdminHeader.test.tsx`, `LogoutButton.test.tsx`, `(panel)/actions.test.ts`)
- **Total tests passing**: 14/14 (new) + 145/145 (Phases 1–4, unaffected) = 159/159 full suite
- **Layers used**: Unit (10: `dal`, `(panel)/actions`), Component (4: `AdminHeader`, `LogoutButton`)
- **Approval tests** (refactoring): None — every Phase 5 file is new
- **Pure functions created**: 0 (this phase is entirely server-only session/action wiring and presentational components)
- **Defects found via the real-runtime manual walkthrough that the mocked unit tests could not have caught**: 2 (see Deviations below) — this is the exact reason task 5.12 exists as a distinct, non-mockable verification layer

## Work Unit Evidence (Phase 5)

| Evidence | Value |
|---|---|
| Focused test command and exact result | Per-unit: `npx vitest run src/lib/session/dal.test.ts` (7/7), `src/components/admin/panel` (4/4 across 2 files), `"src/app/admin/(panel)/actions.test.ts"` (3/3). Full slice: `npm test` → 28 files, 159/159 passed |
| Runtime harness command/scenario and exact result | Real end-to-end walkthrough (task 5.12): `back-siricmanpropiedades` built (`npm run build`) and run as `node dist/main.js` against a throwaway `postgres:16-alpine` Docker container (port 55433), with inline env vars including `RUN_SEED=true` to seed `admin`/`manager`/`user1`; `front-siricmanpropiedades` built (`npm run build`) and run as `next start -p 3057` with `API_INTERNAL_URL=http://127.0.0.1:3056`. See the pass/fail table below and `tasks.md`'s 5.12 entry for the full results, including one discovered-and-fixed defect (task 5.2's amendment) and one discovered-but-not-fixed defect in already-merged Phase 4 code (see Deviations) |
| Rollback boundary | Two independent commits on `feat/admin-session-landing`: the Phase 5 feature commits (dal/panel components/logout action/landing page+error boundary, four commits) and one follow-up fix commit for the task 5.2 defect. Reverting the fix commit alone restores the pre-fix (buggy but merge-blocking, never shipped) `dal.ts`; reverting all Phase 5 commits removes `/admin`, `error.tsx`, and the panel components, leaving Phase 3–4's login/MFA screens dead-ending at a missing `/admin`, exactly as `tasks.md`'s own Phase 5 risk note anticipates |

## Manual End-to-End Walkthrough — Full Results (task 5.12)

Executed locally: `back-siricmanpropiedades` (`main`, unmodified) built and run against a throwaway `postgres:16-alpine` Docker container; `front-siricmanpropiedades` built and run via `next start -p 3057`. Native-form-action screens (login, MFA verify, logout) were driven with `curl` replaying the exact progressive-enhancement multipart form encoding Next renders (`$ACTION_REF_1`/`$ACTION_1:0`/`$ACTION_1:1`/`$ACTION_KEY` hidden fields) — no browser JS needed, since `useActionState`-bound Server Actions render this automatically. The `MfaEnrollment` wizard's password/confirm steps use a local client function as the form `action` (not a bound Server Action reference, per its own docstring), so they are **not** progressively enhanced and required a real browser: Playwright + Chromium were installed ephemerally (outside the repo, in the OS temp dir; not added to `package.json`) for exactly those two steps, with `otplib` (the same version and library the back uses) generating real TOTP codes from the extracted secret.

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Manager login (no MFA) → `/admin`, name renders | **PASS** | `curl` login → `303` → `/admin`; rendered HTML contains `Hola, <!-- -->manager` and the `AdminHeader` shows "manager" |
| 2a | Admin login → MFA setup required | **PASS** | Login → `mfaSetupRequired` → `siricman_admin_setup` cookie (900s) → redirect `/admin/mfa/setup` |
| 2b | Password re-entry: wrong password stays on step with error; correct password advances to scan step | **PASS** | Playwright: wrong password → `role="alert"` text "La contraseña no es correcta o la verificación expiró.", password field still present; correct password → `<code>` secret + `<img alt="Código QR para la app de autenticación">` |
| 2c | Confirm step: wrong code stays with error, secret still visible; correct code enables MFA + generates backup codes (server-side) | **PASS** (server-side) | Playwright: wrong code → alert "El código no es válido..."; correct TOTP (generated via `otplib.authenticator.generate(secret)`) → confirmed server-side via direct DB check (`mfa_enabled=true`, 10 rows in `mfa_backup_codes`) and via a direct re-call to `/api/auth/mfa/enable` returning `"MFA is already enabled"` |
| 2d | Backup-codes screen renders with 10 codes; "Los guardé" gates the continue link | **FAIL — discovered defect, not in this batch's scope** | See Deviations below. Reproduced twice (once mid-flow with a wrong-code retry, once in a clean single-attempt run) — deterministic, not a Playwright timing artifact |
| 2e | MFA-verified login (fresh TOTP against the now-enabled secret) → `/admin`, name renders | **PASS** | `curl` login → `mfaRequired` → `curl` verify with a fresh TOTP → `303` → session cookie set → `/admin` renders `Hola, <!-- -->admin` |
| 3 | Logout (both accounts) → cookie cleared, redirect `/admin/login`, old token revoked | **PASS** | Both: `Set-Cookie: siricman_admin_session=; Max-Age=0`, `Location: /admin/login`; re-calling `/api/auth/me` with the pre-logout token → `401` in both cases |
| 4a | Session cookie is `HttpOnly` | **PASS** | Every `Set-Cookie` observed included `HttpOnly` |
| 4b | Session cookie is `SameSite=Lax` | **PASS** | Every `Set-Cookie` observed included `SameSite=lax` |
| 4c | Session cookie is **not** `Secure` in a non-production/dev run | **Not reproduced in this exact run; already covered elsewhere** | `next start` forces `NODE_ENV=production` internally regardless of the shell environment, so every cookie in this run correctly showed `Secure` per ADR-2's own rule ("`secure: process.env.NODE_ENV === "production"`"). The `NODE_ENV=development` → non-`Secure` branch is exercised with real assertions by the existing `src/lib/session/cookies.test.ts` (`vi.stubEnv("NODE_ENV","development")`, Phase 2, task 2.12) — not fabricated here |
| 4d | Bearer token never appears in HTML or client JS | **PASS** | `grep -c "eyJ"`/`"Bearer"`/the cookie name on the rendered `/admin` HTML → 0 for all three; task 5.10's static bundle check → 0 matches across all 16 `.next/static/**/*.js` chunks |
| extra | `user1` (user-role) login → "no access", no session cookie | **PASS** | Response shows `role="alert"` "Esta cuenta no tiene acceso al panel de administración."; no non-empty `Set-Cookie` for the session cookie |
| extra | Role revoked mid-session (a real `user`-role token used as the session cookie, hitting `/admin` directly) → best-effort revoke + `?reason=forbidden` | **PASS** (after the 5.2 fix) | Pre-fix: `500` ("Cookies can only be modified..."). Post-fix: `307` → `/admin/login?reason=forbidden`; the token returns `401` from `/auth/me` afterward |
| extra | Invalid/garbage session cookie → `?reason=expired` with visible notice | **PASS** (after the 5.2 fix) | Pre-fix: `500`. Post-fix: `307` → `/admin/login?reason=expired`; following the redirect shows "Su sesión expiró. Inicie sesión nuevamente." and the proxy's three expiring `Set-Cookie` headers |

## Deviations from Design (Phase 5)

**Fixed in this batch — task 5.2's `dal.ts`:** `getCurrentUser`'s error paths originally called `clearAllSessionCookies()` (i.e. `cookies().set()`) directly. Real Next 16 throws "Cookies can only be modified in a Server Action or Route Handler" when that runs from a Server Component (`(panel)/layout.tsx`/`page.tsx` are exactly that), producing a `500` for any 401 or role-gate-forbidden case on `/admin` — confirmed via the front server's own stdout during the manual walkthrough, and reproduced twice before the fix. The unit test's `createCookieStore` fake does not model this Next-runtime restriction, so `npm test` stayed green throughout; this is precisely the class of defect task 5.12 exists to catch. Fix: `getCurrentUser` now only calls `redirect(...)`; per ADR-3's own already-written rationale ("the proxy is therefore the single place that clears a stale cookie after a Server Component detects a 401"), the proxy clears all three cookies once the browser lands on `/admin/login` with a `reason` query param. Re-verified against the real runtime after the fix (see the table above) and via updated unit tests that spy on `store.set` and assert it is never called from these paths.

**Found, NOT fixed — reported as a Risk, in already-merged Phase 4 code:** `src/app/admin/(auth)/mfa/setup/page.tsx`'s own guard (`if (!setupToken) redirect("/admin/login")`) re-runs whenever Next automatically refreshes the current route after a Server Action resolves. `confirmMfaAction`'s success path clears the `setupToken` cookie (correctly, per its own contract) before returning `{ step: "codes", backupCodes }` to `MfaEnrollment`'s local `handleConfirm`. The automatic post-action refresh re-executes `page.tsx` with the now-missing cookie, and its guard redirects the whole page to `/admin/login` — discarding `MfaEnrollment`'s local `setState({ step: "codes", ... })` before the backup-codes screen can render. Reproduced twice (once with a preceding wrong-code retry, once as a clean single correct-code attempt) with identical results; confirmed server-side that `confirmMfaAction` itself succeeds every time (MFA enabled, 10 backup codes generated, verified via direct DB queries and a direct API re-call). This is a real, deterministic defect — not the "a refresh loses them" caveat `design.md`'s ADR-8 already accepts (which describes a *manual* page refresh, not every successful confirmation). It lives entirely in Phase 4 files (`mfa/setup/page.tsx`, task 4.11; `confirmMfaAction`, task 4.10), already merged via PR 4 before this Phase 5 batch started — out of this batch's assigned scope (Phase 5 tasks only) and touching already-reviewed/merged code, so it was documented rather than silently patched. **Needs an explicit orchestrator/user decision**: file a follow-up fix (the likely fix is for `page.tsx` to tolerate a request that is itself the Server Action refresh, or for the codes to be delivered through a mechanism that survives that refresh — e.g. not clearing the cookie until the user proceeds past the codes screen) as its own work unit, since Phase 4 is already merged and reviewed.

Everything else in Phase 5 matches `design.md` ADR-6/ADR-7 exactly: `AdminHeader`/`LogoutButton` composition, `logoutAction`'s always-clear-and-redirect contract, and the `(panel)` layout/page's `getCurrentUser()` calls.

## Issues Found (Phase 5)

Two defects, both discovered by the manual end-to-end walkthrough (task 5.12), not by the mocked unit tests — see Deviations above for full detail:
1. **Fixed in this batch**: `dal.ts`'s `getCurrentUser` calling `cookies().set()` from a Server Component (500 in the real runtime).
2. **Found, reported as a Risk, not fixed**: `MfaEnrollment`'s backup-codes screen never rendering, because Phase 4's `mfa/setup/page.tsx` guard fires on the automatic post-Server-Action router refresh once `confirmMfaAction` clears the setup cookie.

Minor, non-blocking: one scratch temp directory (`/tmp/pw-e2e`, holding the ephemeral Playwright/otplib install used only for the walkthrough) could not be removed at cleanup time (`Device or resource busy`, likely a lingering Chromium file handle) after two retries; it is outside the repository, contains no secrets, and does not affect the change. All other e2e infrastructure (both servers, the Docker container, ports 3056/3057/55433, other temp files) was confirmed stopped/freed.

## Remaining Tasks

- [ ] 5.13–5.15 [Orchestrator-owned]: ROADMAP update, `sdd-archive`, spec promotion to back repo; the orchestrator should also decide whether to file the Phase 4 `MfaEnrollment` backup-codes-screen defect (see Deviations above) as a follow-up work unit before or alongside archive

## Status

8/8 Phase 1 + 22/22 Phase 2 + 19/19 Phase 3 + 12/12 Phase 4 + 12/12 Phase 5 tasks complete (73/73 numbered apply tasks across Phases 1–5), plus two post-apply fixes (Phase 3's MFA-verify message-based classification, and Phase 5's `dal.ts` Server-Component cookie-mutation fix) and one discovered-but-unfixed defect in already-merged Phase 4 code reported as a Risk (see Deviations above). All four Phase 5 gate commands pass. Ready for the orchestrator to review PR 5's size and the reported Phase 4 defect, then proceed to `sdd-archive` (tasks 5.13–5.15).

## Workload / PR Boundary (Phase 5)

- Mode: chained PR slice (`stacked-to-main`, per `auto-chain` resolution in `tasks.md`)
- Current work unit: Unit 5 / PR 5 (front: landing, logout, feature close)
- Boundary: starts from `main` (branch `feat/admin-session-landing`, fresh checkout after PRs 1–4 merged), ends at the `dal.ts` fix commit (five commits total: four feature commits for tasks 5.1–5.9, one follow-up fix for the task 5.2 defect)
- Estimated review budget impact: **514 authored lines for the four feature commits** (`git diff --stat main...HEAD -- . ':!openspec' ':!package-lock.json'` at that point) **+ 41 lines for the fix commit (26 insertions, 15 deletions) ≈ 555 total** — over the 400-line default budget, but far smaller than Phases 2–4's precedent (900–1,315 lines), and driven by the same Strict TDD test-volume pattern. The orchestrator's launch prompt explicitly scoped this apply batch to Phase 5 (tasks 5.1–5.12), matching `tasks.md`'s own PR-5 boundary. Every file in this slice composes into the single landing/logout flow (`dal.ts` → panel components → logout action → layout/page/error boundary), so there is no smaller independently-shippable slice without leaving the flow half-built, and the fix commit cannot be separated from the feature it corrects without shipping a known-broken `dal.ts`. **Recommendation: `size:exception` for PR 5** (consistent with the precedent set for PRs 2–4), deferred back to the orchestrator/user per the workload-guard rule.

## Key Learnings (cumulative)

1. `React.cache()`'s request-scoped memoization only exists in React's `react-server` build/condition (`react.react-server.development.js`); the plain build Vitest resolves is a bare passthrough with zero memoization, confirmed by direct source inspection and a Node probe — this cannot be unit-tested in this project's harness, matching the existing ADR-10 precedent for async Server Components.
2. `cookies().set()` (and therefore any function that clears cookies) can only run inside a Server Action or Route Handler in real Next.js — calling it from a Server Component throws at runtime, but a mocked `next/headers` test double will not enforce that constraint, so this class of defect only surfaces under a real build.
3. A Server Action automatically triggers a router refresh of the current route after it resolves; if a page-level guard's condition (e.g. "does this cookie still exist") changes as a side effect of that same action, the refresh's redirect can discard client-side state that the action's return value was supposed to populate.
4. `next start` always forces `NODE_ENV=production` regardless of the invoking shell's environment, so environment-conditional behavior (like a cookie's `Secure` flag) cannot be observed as "development" through that command — only `next dev` or a unit test's `vi.stubEnv` can exercise that branch.
5. Server Actions bound via `useActionState`/a native `<form action={boundServerAction}>` progressively enhance into inspectable hidden fields (`$ACTION_REF_1`, `$ACTION_1:0`, `$ACTION_KEY`) that `curl` can replay verbatim; a plain client function passed as a form's `action` (used when a component needs to branch between two different Server Actions from local state) does not get this treatment and requires a real browser.

## Workload / PR Boundary (Phase 3)

- Mode: chained PR slice (`stacked-to-main`, per `auto-chain` resolution in `tasks.md`)
- Current work unit: Unit 3 / PR 3 (front: login + MFA verify)
- Boundary: starts from `main` (branch `feat/admin-session-login`, fresh checkout after PRs 1–2 merged), ends at commit `467d63a` (the MFA-verify fix, on top of the six Phase 3 feature commits)
- Estimated review budget impact: **1,315 insertions ≈ 1,315 authored changed lines — well over the 400-line default budget**, and in line with Phase 2's precedent (also over budget for the same reason: Strict TDD's test volume — roughly 660 of the ~1,315 lines are test code across 9 new test files). The orchestrator's launch prompt explicitly scoped this apply batch to "Phase 3 ONLY... Do not start Phase 4," matching `tasks.md`'s own PR-3 boundary. Every file in this slice composes into a single cohesive login+MFA-verify flow (messages → role gate → form primitives → shell → login → MFA verify), so there is no smaller independently-shippable slice within Phase 3 without leaving the flow half-built. **Recommendation: `size:exception` for PR 3** (consistent with the precedent set for PR 2), or the orchestrator may choose to split it into chained sub-PRs before opening it — deferred back to the orchestrator/user per the workload-guard rule.

### Phase 4 — Front: MFA enrollment (Slice 4, PR 4)

Repo: `front-siricmanpropiedades`, branch `feat/admin-session-enrollment` (fresh from `main` after PRs 1–3 merged).

- [x] 4.1 Setup — Ran `npm view qrcode dependencies` (`{ pngjs: "^5.0.0", yargs: "^15.3.1", dijkstrajs: "^1.0.1" }`, `qrcode@1.5.4`). `yargs` alone exists only for `qrcode`'s CLI bin, not its `toString()` API, and drags a multi-package transitive tree with it (verified: adding `qrcode` would install far more than a single package). Decision: **use the `uqr` fallback** — zero dependencies, ESM, exports `renderSVG` directly (verified via `npm view uqr dependencies` → empty object).
- [x] 4.2 Setup — Added `uqr@0.1.3` to `package.json`/`package-lock.json` (`npm install uqr` — 1 package added, 0 vulnerabilities). No `@types/uqr` needed: `uqr` ships its own `.d.ts`.
- [x] 4.3 RED — `src/lib/mfa/qr.test.ts`: failing `renderQrDataUri` tests (data-URI shape; no outbound `fetch` call)
- [x] 4.4 GREEN — `src/lib/mfa/qr.ts`: `renderQrDataUri` using `uqr`'s `renderSVG(url, { ecc: "M", border: 1 })`, base64-encoded into a `data:image/svg+xml;base64,...` URI
- [x] 4.5 RED — `src/components/admin/auth/MfaEnrollment/MfaEnrollment.test.tsx`: failing step-wizard RTL tests
- [x] 4.6 GREEN — `src/components/admin/auth/MfaEnrollment/MfaEnrollment.tsx` (+ CSS Module): password → scan → codes wizard, local `useState`, each step's `<form action={...}>` wired to `SubmitButton`'s `useFormStatus`
- [x] 4.7 RED — `src/components/admin/auth/BackupCodes/BackupCodes.test.tsx`: failing tests (10 codes as a list; continue link gated by acknowledgement)
- [x] 4.8 GREEN — `src/components/admin/auth/BackupCodes/BackupCodes.tsx` (+ CSS Module): 10-code list, "Los guardé" checkbox gates a real `<a href="/admin/login">` (an `aria-disabled` placeholder renders until checked)
- [x] 4.9 RED — `src/app/admin/(auth)/mfa/setup/actions.test.ts`: 22 failing tests for `enableMfaAction`/`confirmMfaAction` (success shapes, wrong password/code, all 5 token-rejection messages ×2 actions, the two back "non-retryable" 400 messages, 429/network mapping)
- [x] 4.10 GREEN — `src/app/admin/(auth)/mfa/setup/actions.ts`: `enableMfaAction`/`confirmMfaAction` implemented against the verified back contract (see Deviations below)
- [x] 4.11 Create — `src/app/admin/(auth)/mfa/setup/page.tsx`: requires the setup-pending cookie, renders `<MfaEnrollment>` wired to both actions
- [x] 4.12 Verify (slice 4 gate) — all four front gate commands passed

**Status: 12/12 Phase 4 tasks complete.**

## TDD Cycle Evidence (Phase 4)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 4.3–4.4 | `src/lib/mfa/qr.test.ts` | Unit (node) | N/A (new) | ✅ `Cannot find module './qr'` | ✅ `npx vitest run` → 1 file, 2/2 passed | ✅ 2 cases (data-URI shape/decodable SVG; no outbound `fetch`) | ➖ None needed |
| 4.5–4.6 | `MfaEnrollment.test.tsx` | Component (jsdom) | N/A (new) | ✅ `Failed to resolve import "./MfaEnrollment"` | ✅ `npx vitest run` → 1 file, 5/5 passed | ✅ 5 cases (password step first; wrong password stays + error; correct password → scan step with QR/secret; wrong confirm code keeps QR/secret visible + error, no codes; correct confirm code → 10 codes + acknowledgement-gated link) | ➖ None needed |
| 4.7–4.8 | `BackupCodes.test.tsx` | Component (jsdom) | N/A (new) | ✅ `Failed to resolve import "./BackupCodes"` | ✅ `npx vitest run` → 1 file, 2/2 passed | ✅ 2 cases (exactly 10 list items; link hidden until checkbox checked) | ➖ None needed |
| 4.9–4.10 | `src/app/admin/(auth)/mfa/setup/actions.test.ts` | Unit (node), mocked `next/headers`/`next/navigation`/`@/lib/api/auth`/`@/lib/mfa/qr` | N/A (new) | ✅ `Cannot find module './actions'` | ✅ `npx vitest run` → 1 file, 22/22 passed | ✅ 22 cases across both actions: missing cookie → redirect; success shape; wrong-input retry (password/code) keeps cookie; 5 token-rejection messages × 2 actions → expired redirect (`it.each`); 2 "non-retryable" 400 messages (confirm only, `it.each`); 429 → throttled, cookie kept; network(0) → unavailable (enable only) | ➖ None needed |
| 4.11 | — (no test; async Server Component, per ADR-10) | N/A | N/A (new) | N/A | ✅ Verified via the slice-4 `npm run build` route table (`/admin/mfa/setup` present) | N/A | N/A |

### Test Summary (Phase 4)
- **Total tests written**: 31 (2 + 5 + 2 + 22, across 4 new test files)
- **Total tests passing**: 31/31 (new) + 114/114 (Phases 1–3, unaffected) = 145/145 full suite
- **Layers used**: Unit (24: `qr`, both `setup/actions.test.ts` describe blocks), Component (7: `MfaEnrollment`, `BackupCodes`)
- **Approval tests** (refactoring): None — every Phase 4 file is new
- **Pure functions created**: 0 (`renderQrDataUri` is server-only/offline but not pure in the strict sense — it allocates via `Buffer`; `classifyEnrollmentError` inside `setup/actions.ts` is pure but private/untested directly, covered through both actions' RED tests)

## Work Unit Evidence (Phase 4)

| Evidence | Value |
|---|---|
| Focused test command and exact result | Per-unit: `npx vitest run src/lib/mfa/qr.test.ts` (2/2), `"src/components/admin/auth/MfaEnrollment"` (5/5), `"src/components/admin/auth/BackupCodes"` (2/2), `"src/app/admin/(auth)/mfa/setup/actions.test.ts"` (22/22). Full slice: `npm test` → 24 files, 145/145 passed |
| Runtime harness command/scenario and exact result | `npm run build` (Next 16, Turbopack) → `Compiled successfully`, TypeScript pass, static generation 7/7, route table shows `┌ ○ /`, `├ ○ /_not-found`, `├ ƒ /admin/login`, `├ ƒ /admin/mfa`, `└ ƒ /admin/mfa/setup` plus `ƒ Proxy (Middleware)`. This confirms the new enrollment route compiles and is reachable through the real Next.js router. `tasks.md`'s designated runtime harness for this unit is a **manual** end-to-end enrollment walkthrough against a real back instance with one scratch `admin` account (confirming the rendered QR encodes the real `otpauthUrl` secret and the shown backup codes match the API response) — deferred to the orchestrator/user, since it requires a running back instance, a real database account, and authorization to start server processes that this apply session does not have; the build's route/compile check plus the 22 action-level tests against the verified exact back contract (read directly from `mfa.controller.ts`/`mfa.service.ts`/`auth.service.ts`) are the automatable proof available in this session |
| Rollback boundary | Two independent commits on `feat/admin-session-enrollment`, each revertible alone: `ccc686f` (QR SVG rendering: `uqr` dependency + `qr.ts` + test) and `7164808` (enrollment wizard: `MfaEnrollment` + `BackupCodes` + `setup/actions.ts` + `setup/page.tsx`, all their tests). `/admin/mfa/setup` does not exist until this branch merges, so no already-deployed route is affected by reverting either commit; reverting `ccc686f` alone would break `7164808`'s `renderQrDataUri` import (revert in reverse commit order if reverting more than the last commit) |

## Slice 4 Gate — Full Verification (task 4.12)

| Command | Observed result |
|---|---|
| `npm test` | 24 test files passed, 145 tests passed |
| `npm run lint` | `eslint` — 0 errors, 1 warning (`@next/next/no-img-element` on `MfaEnrollment.tsx`'s QR `<img>` — expected and accepted: `design.md` ADR-9 explicitly specifies a plain `<img alt="..." width={200} height={200}>` for the QR, and the source is a request-time-generated `data:` URI, which `next/image` cannot usefully optimize without `unoptimized`; exit code 0, no precedent for suppressing this warning elsewhere in the codebase was found or needed) |
| `npx tsc --noEmit` | No output, no errors |
| `npm run build` | `next build` (Turbopack) — compiled successfully, TypeScript pass, static generation 7/7, route table: `/`, `/_not-found` static; `/admin/login`, `/admin/mfa`, `/admin/mfa/setup` dynamic; `Proxy (Middleware)` present |

## Files Changed (Phase 4, front repo, `feat/admin-session-enrollment` branch)

| File | Action | What Was Done |
|---|---|---|
| `package.json`, `package-lock.json` | Modified | Added `uqr` (fallback for `qrcode`, per task 4.1's recorded decision) |
| `src/lib/mfa/qr.ts` (+ test) | Created | `renderQrDataUri(otpauthUrl)` — offline SVG QR rendered as a base64 data URI |
| `src/components/admin/auth/MfaEnrollment/*` (+ test) | Created | Step wizard: password re-entry → QR/secret scan → confirm code |
| `src/components/admin/auth/BackupCodes/*` (+ test) | Created | 10-code list, acknowledgement-gated continue link |
| `src/app/admin/(auth)/mfa/setup/actions.ts` (+ test) | Created | `enableMfaAction`, `confirmMfaAction` — verified back error-contract mapping |
| `src/app/admin/(auth)/mfa/setup/page.tsx` | Created | Requires the setup-pending cookie, renders `<MfaEnrollment>` |

## Commits (front repo, `feat/admin-session-enrollment`, not pushed)

- `ccc686f` — `feat(admin-session): render MFA enrollment QR codes as SVG data URIs`
- `7164808` — `feat(admin-session): add the MFA enrollment wizard and Server Actions`

`git diff --stat main...HEAD -- . ':!openspec' ':!package-lock.json'`: 12 files changed, 900 insertions(+), 1 deletion(-).

## Deviations from Design (Phase 4)

**Recorded, intentional deviation — dependency substitution (task 4.1's own decision gate, not a silent deviation):** `design.md` ADR-9 names `qrcode` as the primary choice. `npm view qrcode dependencies` shows `{ pngjs, yargs, dijkstrajs }` — `yargs` exists only for `qrcode`'s CLI bin script, not its `QRCode.toString()` API, and pulls its own multi-package tree along for a feature this change never uses. Per ADR-9's own explicit fallback clause ("`uqr`... an acceptable fallback if `qrcode`'s transitive dependencies are objectionable") and task 4.1's instruction to record the outcome, `uqr` was used instead: zero dependencies, ships its own types, and its `renderSVG(text, { ecc, border })` produces an equivalent SVG, base64-encoded into the same `data:image/svg+xml;base64,...` shape ADR-9 requires. No other part of ADR-9 changed: the secret and `otpauthUrl` still never leave the server, rendering is still fully offline, and the client still only ever receives the rendered QR plus the plaintext secret for manual entry.

**Documented implementation choice — `EnrollmentState` split into per-action types:** `design.md`'s Interfaces/Contracts section types a single `EnrollmentState` union (`"password" | "scan" | "codes"`) as "Server Action state." Task 4.9 fixes `confirmMfaAction`'s signature to take only `code` — it has no way to independently reproduce a `qrSvgDataUri`/`secret` for the `"scan"` variant on a wrong-code retry without either a second server round trip or calling `mfa/enable` again, and the latter would make `MfaService.startEnrollment` generate a **new** secret server-side, invalidating whatever the user's authenticator app already scanned (a real behavioral bug, not a cosmetic one). `setup/actions.ts` therefore exports two narrower types instead: `EnableMfaState = { step: "password"; error? } | { step: "scan"; qrSvgDataUri; secret }` and `ConfirmMfaState = { step: "scan"; error } | { step: "codes"; backupCodes }`. `MfaEnrollment.tsx` keeps the previously-received `qrSvgDataUri`/`secret` in its own local component state across a failed confirm attempt, rather than expecting the action to resupply them. Every scenario in `specs/admin-session/spec.md`'s "MFA Enrollment" requirement is still satisfied verbatim (wrong password stays on that step with the QR/secret withheld; wrong code shows an error without revealing backup codes and without losing the already-shown QR/secret; successful confirm shows the codes and clears the setup cookie).

**Verified against the back directly (per this apply session's launch prompt), not guessed:** the two "non-retryable" 400 messages handled as an expired-token redirect — `"MFA is already enabled"` and `"No pending MFA enrollment. Call /auth/mfa/enable first"` — were read verbatim from `back-siricmanpropiedades/src/auth/mfa/mfa.service.ts`'s `startEnrollment`/`confirmEnrollment`, and the five 401 token-rejection messages plus the `enable`/`confirm` 401/400 success-path shapes were confirmed from `mfa.controller.ts` and `auth.service.ts` before writing `setup/actions.test.ts`'s RED cases, following the same verify-before-implement discipline established by Phase 3's MFA-verify fix.

## Issues Found (Phase 4)

None. All four gate commands passed on the first attempt after implementation. The one ESLint warning (`@next/next/no-img-element`) is expected and accepted per the Slice 4 Gate table above, not a defect. No pre-existing test failures were encountered as a baseline (114/114 green before this batch).

## Workload / PR Boundary (Phase 4)

- Mode: chained PR slice (`stacked-to-main`, per `auto-chain` resolution in `tasks.md`)
- Current work unit: Unit 4 / PR 4 (front: MFA enrollment)
- Boundary: starts from `main` (branch `feat/admin-session-enrollment`, fresh checkout after PRs 1–3 merged), ends at commit `7164808`
- Estimated review budget impact: **900 insertions + 1 deletion ≈ 901 authored changed lines — over the 400-line default budget**, though smaller than Phases 2–3 (roughly 460 of the ~900 lines are test code across 4 new test files: 22 action tests covering both a success path and every distinct back error message needed to honestly triangulate the verified error contract). The orchestrator's launch prompt explicitly scoped this apply batch to "Phase 4 ONLY... Do not start Phase 5," matching `tasks.md`'s own PR-4 boundary. The QR-rendering commit (`ccc686f`) is technically independently shippable (it has no dependency on the wizard), but splitting it into its own PR would leave a QR-rendering utility with no caller until PR 4b landed — not a materially better reviewer experience than one cohesive PR. **Recommendation: `size:exception` for PR 4** (consistent with the precedent set for PR 2 and PR 3), or the orchestrator may choose to split `ccc686f` into its own chained sub-PR before opening PR 4 — deferred back to the orchestrator/user per the workload-guard rule.

## Follow-up: backup-codes screen defect (Phase 5 deviation #2) — RESOLVED

- **Root cause (confirmed):** `confirmMfaAction` cleared the `setupToken` cookie on success. Modifying a cookie inside a Server Action makes Next re-render the current route; `/admin/mfa/setup`'s guard then found no cookie and redirected to `/admin/login`, discarding the wizard state before the backup codes rendered. MFA was enabled server-side, but the admin never saw the codes.
- **Fix:** `confirmMfaAction` no longer touches any cookie on success. New `finishEnrollmentAction` Server Action clears the `setupToken` cookie and redirects to `/admin/login`. `BackupCodes` now submits it through a form whose button stays disabled until "Los guardé" is checked. The leftover `setupToken` is harmless after enrollment (`enable` answers 400 "MFA is already enabled"; the cookie expires in 15 min).
- **TDD:** RED observed (5 failing tests: confirm must not call `store.set`; `finishEnrollmentAction` missing ×2; `BackupCodes` continue button ×2), plus 1 failing `MfaEnrollment` test for the finish wiring. GREEN: full suite 28 files, 162/162.
- **Gate:** `npm test` 162/162; `npm run lint` 0 errors (1 pre-existing accepted `no-img-element` warning); `npx tsc --noEmit` clean; `npm run build` compiled, routes `/admin`, `/admin/login`, `/admin/mfa`, `/admin/mfa/setup`.
- **Real e2e (Playwright + otplib, throwaway Postgres on 55433, back `node dist/main.js` on 3056 with `RUN_SEED=true`, front `next start` on 3057):** admin login → `/admin/mfa/setup`; password step → QR + 16-char secret; confirm with a real TOTP → **10 backup codes rendered** on `/admin/mfa/setup`; continue button disabled before acknowledgement; after acknowledgement → `/admin/login` with no cookies left; fresh MFA-verified login → `/admin` showing "admin". All servers, the container and temp dirs were cleaned up; ports 3056/3057/55433 free.

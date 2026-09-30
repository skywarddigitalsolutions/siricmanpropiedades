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

## Remaining Tasks

- [ ] Phase 3 (front, Slice 3/PR 3): login + MFA verify
- [ ] Phase 4 (front, Slice 4/PR 4): MFA enrollment
- [ ] Phase 5 (front, Slice 5/PR 5): landing, logout, feature close
- [ ] 5.13–5.15 [Orchestrator-owned]: ROADMAP update, `sdd-archive`, spec promotion to back repo

## Status

8/8 Phase 1 tasks + 22/22 Phase 2 tasks complete (30/59 total tasks across all five phases). Ready for the orchestrator to review/decide on PR 2's size (`size:exception` recommended, or split into chained sub-PRs), then dispatch `sdd-apply` for Phase 3.

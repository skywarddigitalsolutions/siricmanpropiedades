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

**Status: 8/8 Phase 1 tasks complete.** Phases 2–5 (front repo) not started — out of scope for this apply batch.

## TDD Cycle Evidence

| Task | RED (observed) | GREEN (observed) | REFACTOR |
|---|---|---|---|
| 1.1–1.2 `toSessionUser` | `npm test -- auth.service.spec.ts` → TS2339 `Property 'toSessionUser' does not exist`, suite failed to run | `npm test -- auth.service.spec.ts` → 18 passed, 18 total | `buildSessionResponse`/`checkAuthStatus` now spread `toSessionUser(user)`; full `npm test` 39 suites/399 tests green, no behavior change |
| 1.3–1.4 `GET /me` | `npm test -- auth.controller.spec.ts` → TS2339 `Property 'me' does not exist on type 'AuthController'` (×3), suite failed to run | `npm test -- auth.controller.spec.ts` → 2 passed, 2 total | None needed; controller method matches ADR-1 exactly |

## Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and exact result | `npm test -- auth.service.spec.ts auth.controller.spec.ts` → both suites pass (18 + 2 = 20 tests); full `npm test` → 39 suites passed, 399 tests passed |
| Runtime harness command/scenario and exact result | N/A — no live server needed per design/tasks; the endpoint is fully covered by Jest unit tests and guard-metadata reflection (`Reflect.getMetadata(GUARDS_METADATA, ...)`, `Reflect.getMetadata(META_ROLES, ...)`), matching the back's existing no-e2e-infra pattern. Structural compose validation substituted for a runtime check on the config task (see below). |
| Rollback boundary | Two independent commits on `feat/auth-me`: `387e481` (endpoint: `auth.controller.ts`, `auth.controller.spec.ts`, `auth.service.ts`, `auth.service.spec.ts`) and `3592d5a` (deploy: `compose.yml`, `README.md`). Either can be reverted alone; `/auth/me` is additive and the compose line is inert for the current `web` image. |

## Slice 1 Gate — Full Verification (task 1.8)

| Command | Observed result |
|---|---|
| `npm test` | 39 suites passed, 399 tests passed |
| `npm run lint` | `eslint "src/**/*.ts" --fix` — no output, no errors |
| `npx tsc -p tsconfig.build.json --noEmit` | No output, no errors |
| `npm run build` | `nest build` — no output, no errors |

## Compose Structural Validation (task 1.8 / risk note)

`docker compose -f deploy/compose.yml config` requires `deploy/.env`, which does not exist and must not be read/written (denied). Used a temporary override + dummy vars file, both deleted immediately after:

- `deploy/override.tmp.yml` (temporary): `db`/`api` services' `env_file` overridden to `[]`
- `deploy/dummy-vars.tmp` (temporary): dummy `SITE_DOMAIN`/`API_DOMAIN`/`ACME_EMAIL` for Caddy interpolation
- Ran `docker compose -f deploy/compose.yml -f deploy/override.tmp.yml --env-file deploy/dummy-vars.tmp config` → resolved cleanly, `web.environment.API_INTERNAL_URL: http://api:3000` present as expected
- Both temp files deleted immediately after; confirmed absent (`Test-Path` → `False` for both)

## Files Changed (back repo, `feat/auth-me` branch)

| File | Action | What Was Done |
|---|---|---|
| `src/auth/auth.service.ts` | Modified | Added public `toSessionUser(user)`; `buildSessionResponse`/`checkAuthStatus` refactored to spread it |
| `src/auth/auth.service.spec.ts` | Modified | Added `toSessionUser` describe block (field/role mapping; no `sign`/`revokedTokenRepository.save` call) |
| `src/auth/auth.controller.ts` | Modified | Added `GET me` (`@Auth()`, `@Header('Cache-Control', 'no-store')`, Swagger docs) delegating to `authService.toSessionUser(user)` |
| `src/auth/auth.controller.spec.ts` | Created | Guard metadata (`AuthGuard('jwt')`, `UserRoleGuard`), empty `META_ROLES`, delegation, no `logout`/`checkAuthStatus` call |
| `deploy/compose.yml` | Modified | `web.environment.API_INTERNAL_URL: http://api:3000` |
| `deploy/README.md` | Modified | New section 7 (neutral Spanish runbook note, verbatim from `design.md`) |

## Commits (back repo, not pushed)

- `387e481` — `feat(auth): add non-rotating GET /auth/me session read`
- `3592d5a` — `docs(deploy): wire API_INTERNAL_URL for the admin panel BFF`

`git diff --stat main...HEAD`: 6 files changed, 167 insertions(+), 6 deletions(-) — well within the 400-line PR 1 budget (estimated 150–200).

## Deviations from Design

None — implementation matches design.md ADR-1 exactly. One test-authoring correction (not a design deviation): the first draft of `auth.controller.spec.ts` asserted `guards[0]` with `toBeInstanceOf(AuthGuard('jwt'))`; `@UseGuards` metadata stores the guard classes themselves (memoized by `@nestjs/passport`), not instances, so the assertion was corrected to `toBe(AuthGuard('jwt'))` before the RED→GREEN cycle was considered valid. No production code was affected by this correction.

## Issues Found

None.

## Workload / PR Boundary

- Mode: chained PR slice (`stacked-to-main`, per `auto-chain` resolution in tasks.md)
- Current work unit: Unit 1 / PR 1 (back: `GET /auth/me` + compose env + runbook)
- Boundary: starts from `main` (fresh `feat/auth-me` branch, already checked out), ends at commit `3592d5a`
- Estimated review budget impact: ~173 changed lines, well under 400; no chaining needed within this slice

## Remaining Tasks

- [ ] Phase 2 (front, Slice 2/PR 2): transport & session foundation
- [ ] Phase 3 (front, Slice 3/PR 3): login + MFA verify
- [ ] Phase 4 (front, Slice 4/PR 4): MFA enrollment
- [ ] Phase 5 (front, Slice 5/PR 5): landing, logout, feature close
- [ ] 5.13–5.15 [Orchestrator-owned]: ROADMAP update, `sdd-archive`, spec promotion to back repo

## Status

8/8 Phase 1 tasks complete. Ready for the orchestrator to review/open PR 1 (stacked-to-main), then dispatch `sdd-apply` for Phase 2 in the front repo.

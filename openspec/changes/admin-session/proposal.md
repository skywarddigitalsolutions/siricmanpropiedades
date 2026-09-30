# Proposal: Admin session (login + MFA from Next, token strategy)

## Intent

The admin panel (features 6 and 8) needs an authenticated session, but the front has no admin routes, no API client, and no session handling. The back already implements login, mandatory MFA for `admin`, MFA enrollment, and token revocation. What is missing is a secure way for admin users to sign in from the Next.js site and keep that session while they use the panel.

This change delivers that session layer so feature 6 (property list/editor) can build on it. It also settles the pending ROADMAP decision: **"Admin token strategy: httpOnly cookie via Next (BFF) vs bearer in browser; refresh token — feature 5"**. The decision is a BFF with an httpOnly cookie and no refresh token.

Success means an `admin` or `manager` can sign in, pass MFA verification (or enroll in MFA the first time), reach `/admin`, see their name, and sign out. The browser never holds the bearer token. A `user`-role account cannot enter the panel. An expired session sends the user back to login with a clear reason. Admins behind different IPs never share one throttle bucket.

## Scope

### In Scope

**Back repo (`back-siricmanpropiedades`)**
- A new non-rotating `GET /api/auth/me` endpoint that requires a full session and returns `{ id, userName, isActive, roles }`. It rejects `mfa_verify`/`mfa_setup` scoped tokens and does not revoke or reissue the token.
- Unit/e2e tests for `/auth/me`, plus an OpenSpec spec for the new back capability `auth-session-read`.
- Deploy: add `API_INTERNAL_URL: http://api:3000` (the internal service URL; the exact port is confirmed in design) to the `web` service `environment` in `deploy/compose.yml`, and add a runbook note to the Spanish `deploy/README.md` about the new variable and the forwarding requirement for `X-Forwarded-For`.

**Front repo (`front-siricmanpropiedades`)**
- A server-only API client (`import "server-only"`) that:
  - reads `API_INTERNAL_URL`;
  - attaches `Authorization: Bearer <token>` from the session cookie;
  - forwards the real client IP as `X-Forwarded-For`, taken from the inbound request that Caddy sent;
  - maps a `401` to cookie clearing plus a redirect to `/admin/login?reason=expired`.
- Session cookie handling: the JWT is stored in an httpOnly, Secure (in production), SameSite=Lax cookie scoped to `/admin`, with a max-age that matches the 60-minute JWT lifetime. The short-lived `mfaToken` and `setupToken` are kept in separate short-lived httpOnly cookies and never reach the client either.
- `src/proxy.ts` (Next.js 16 renamed `middleware.ts` to `proxy.ts`) with a cookie-presence check only. It redirects unauthenticated `/admin/**` requests to `/admin/login`, and redirects an authenticated visit to `/admin/login` to `/admin`. It does not verify the JWT.
- Server Actions for every mutation: login, MFA verify, MFA enable, MFA confirm, and logout.
- Screens, styled with the public-site brand tokens (CSS Modules):
  - `/admin/login`: username and password. Shows the generic invalid-credentials message, a throttle/lockout message for `429`, and an expired-session message when `reason=expired` is present.
  - MFA verify: accepts a 6-digit TOTP code or a backup code.
  - First-time MFA enrollment, in this order:
    1. Re-enter the password.
    2. Scan the QR code, or enter the secret manually.
    3. Confirm a code.
    4. See the one-time backup codes, with a "saved them" acknowledgement.
    5. Go back to login to complete a full MFA-verified sign-in.
- A minimal authenticated `/admin` landing page. It is a server component that calls `/auth/me`, shows the user name, and has a logout button.
- Role gate: only `admin`/`manager` may enter `/admin`.
  - When a `user`-role account logs in, the front does not keep the session. It revokes the token through the API logout, clears or never sets the cookie, and shows a "no access" message.
  - If `/auth/me` later returns a user with no allowed role, the same clearing applies.
- Logout: a Server Action calls `POST /api/auth/logout`, clears the cookie whatever the API result, and redirects to `/admin/login`.
- Env documentation for `API_INTERNAL_URL` (local dev points at the local API). No `JWT_SECRET` in the front.

**Feature close (not a code task)**
- Tick the ROADMAP pending-decision checkbox for the admin token strategy and record the outcome. Mark feature 5 done.

### Out of Scope
- Refresh tokens and silent renewal. `check-status` is never called, because it rotates the token.
- Property list/editor, the leads inbox, and any other admin feature (features 6 and 8).
- Aligning the look with the Claude Design admin-panel project, which was unavailable during planning. That alignment is deferred to feature 6.
- MFA disable, password change, and user management UI.
- JWT verification in the middleware or edge runtime.
- End-to-end browser test infrastructure (Playwright/Cypress).
- Any change to the back's login, MFA, throttling, or `TRUST_PROXY` behavior beyond adding `/auth/me`.

## Capabilities

### New Capabilities
- `admin-session` (front repo): admin authentication through the Next.js BFF. It covers:
  - the login, MFA verify, and MFA enrollment flows;
  - httpOnly session cookie handling and the cookie-presence middleware;
  - reactive expiry (`401` → clear the cookie → `/admin/login?reason=expired`);
  - the role gate for `admin`/`manager`;
  - logout;
  - client-IP forwarding (`X-Forwarded-For`) to the API;
  - the authenticated `/admin` landing page.
- `auth-session-read` (back repo, new capability): the non-rotating `GET /api/auth/me` session read. The back has no existing auth spec in `openspec/specs/`. This capability is spec'd in the back repo (`back-siricmanpropiedades/openspec/specs/auth-session-read/spec.md` at archive). The spec phase should author it under this change's `specs/auth-session-read/spec.md` and mark it as targeting the back repo.

### Modified Capabilities
- None. The front has no existing specs, and the back's existing specs (`neighborhoods`, `property-images`, `property-management`, `property-public-catalog`) are not affected.

## Approach

This follows the settled exploration decisions.

- **BFF with Server Actions.** All API calls run on the Next server. Mutations are Server Actions so they inherit Next's built-in Origin check against CSRF, and no Route Handlers are added for auth. Admin pages are server components that read the session through `/auth/me`. Client components are limited to form interactivity, such as pending state and code inputs.
- **Internal transport.** `API_INTERNAL_URL` goes over the compose network. `TRUST_PROXY=1` stays. The BFF copies the client IP that Caddy put on the inbound request into the outbound `X-Forwarded-For`. This keeps the per-IP throttle (auth 5/min, global 20/min) per real user. It is safe because the `api` service is not reachable from outside the network.
- **No token introspection in the front.** The middleware only checks that the cookie exists, for UX. The API is the source of truth on every data fetch, and any `401` triggers reactive expiry.
- **Login state machine.** The Server Action branches on the three login response shapes:
  - Full session: apply the role gate, then set the cookie and go to `/admin`.
  - `mfaRequired`: store `mfaToken` in a short-lived cookie and go to MFA verify.
  - `mfaSetupRequired`: store `setupToken` in a short-lived cookie and go to enrollment.
  - MFA verify returns the full-session shape and goes through the same role gate.
  - Because MFA confirm returns only backup codes, enrollment ends by sending the user back to login.
- **QR rendering.** The QR is generated server-side from `otpauthUrl`, and the secret is also shown for manual entry. Design picks the library and must avoid sending the secret to third-party services.
- **Back `/auth/me`.** It reuses the existing `@Auth()` guard with full-session enforcement and returns only public user fields.
- **Delivery.** Auto-chain, stacked-to-main, with each PR merged before the next. The back slice goes first so that the front can integrate against a real endpoint.

### Slice plan (chained PRs, 400-line advisory budget)

| # | Repo | Slice | Est. authored lines |
|---|------|-------|--------------------|
| 1 | back | `GET /api/auth/me` + tests + `auth-session-read` spec; compose `web` env `API_INTERNAL_URL`; `deploy/README.md` runbook note | ~150–200 |
| 2 | front | Server-only API client (XFF forwarding, 401 mapping), session/pending-token cookie helpers, `middleware.ts`, env docs, tests | ~300–380 |
| 3 | front | `/admin/login` + MFA verify screens and Server Actions (login state machine, role gate on full session, error/429/expired messages), tests | ~350–400 |
| 4 | front | MFA enrollment flow (password → QR/secret → confirm → backup codes → back to login), tests | ~350–400 |
| 5 | front | `/admin` landing (`/auth/me`, user name), `me`-based role gate, logout action, tests; then the feature close (ROADMAP/doc updates) | ~200–280 |

**Review workload forecast.** The total is about 1,350–1,650 authored lines, well over the 400-line budget, so there is a high risk of exceeding it. Chained PRs are required, and the strategy is already resolved as auto-chain, stacked-to-main. Slices 3 and 4 sit near the budget. If either exceeds it, split screens from actions rather than trimming tests.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `back-siricmanpropiedades/src/auth/auth.controller.ts` | Modified | Add `GET me` (non-rotating, full session) |
| `back-siricmanpropiedades/src/auth/auth.service.ts` (+ spec) | Modified | Session read mapping to `{ id, userName, isActive, roles }` |
| `back-siricmanpropiedades/deploy/compose.yml` | Modified | `web.environment.API_INTERNAL_URL` |
| `back-siricmanpropiedades/deploy/README.md` | Modified | Spanish runbook note (new env, XFF forwarding, redeploy order) |
| `back-siricmanpropiedades/openspec/` | New | `auth-session-read` spec |
| `front-siricmanpropiedades/src/middleware.ts` | New | Cookie-presence redirect for `/admin/**` |
| `front-siricmanpropiedades/src/lib/api/` (server-only) | New | API client, XFF forwarding, 401 handling |
| `front-siricmanpropiedades/src/lib/session/` | New | Cookie read/write/clear helpers, role gate |
| `front-siricmanpropiedades/src/app/admin/login/`, MFA verify and enrollment routes | New | Screens + Server Actions + CSS Modules |
| `front-siricmanpropiedades/src/app/admin/page.tsx` (+ layout) | New | Authenticated landing with user name and logout |
| `front-siricmanpropiedades/package.json` | Modified | Possible QR generation dependency and `server-only` |
| `front-siricmanpropiedades/docs/ROADMAP.md` | Modified | Feature close: decision checkbox + feature 5 status |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Wrong or missing XFF forwarding makes every admin share one throttle bucket, and 5/min login plus the lockout locks everyone out | Med | Unit-test header propagation; do a manual end-to-end check after deploy (two IPs, independent throttles); document it in the runbook |
| Spoofed XFF from the browser reaching the API | Low | Caddy overwrites XFF for untrusted clients; `api` is network-internal; the BFF derives the value only from the inbound request's proxy header |
| Someone later uses `check-status` for periodic reads, and the rotation race logs users out | Low | The spec forbids it; only `/auth/me` is used for reads |
| Cookie `Secure` breaks local HTTP dev | Med | Set `Secure` conditionally in non-production; covered in design |
| Pending `mfaToken`/`setupToken` cookies outlive their server validity | Low | Cookie max-age matches the token TTL (5/15 min); clear them on success or failure |
| Deploy order: the new web image expects `API_INTERNAL_URL` before the compose change is applied | Med | Back slice 1 ships the compose change first; the runbook says to apply it before pulling the new web image; the front fails with a clear server error if the variable is unset |
| The admin visual design may diverge from the Claude Design project | Med | Accepted; alignment deferred to feature 6 |
| A QR dependency adds bundle or supply-chain surface | Low | Render server-side only; choose a small, maintained library in design |

## Rollback Plan

- **Back slice 1.** `/auth/me` is additive and nothing in production depends on it before the front ships. Revert the PR and redeploy the `api` image. The compose `API_INTERNAL_URL` line is inert for the current web image, so it can stay or be reverted with the PR.
- **Front slices 2–5.** All routes live under the new `/admin` segment, and the public site is untouched. Rollback means reverting the merged PR(s) and redeploying the previous `web` image tag from GHCR. The user runs these server commands.
- **Sessions.** Clearing the cookie invalidates nothing server-side. If a token leak is suspected, rotating `JWT_SECRET` on the back invalidates every issued token.
- **ROADMAP.** The decision entry is reverted with the feature-close commit if the feature is rolled back.

## Dependencies

- Back auth module as described in `explore.md`: login, MFA, logout, revocation by `jti`, `TRUST_PROXY=1`.
- Caddy forwarding the client IP on requests to `web` (default `reverse_proxy` behavior; verify in design).
- The user applies the compose and env changes on the VPS. Claude does not connect to the server.
- An authenticator app for the manual MFA check.

## Success Criteria

- [ ] `GET /api/auth/me` returns `{ id, userName, isActive, roles }` for a full session, rejects scoped and invalid tokens with `401`, and does not revoke or rotate the token. Covered by back tests.
- [ ] An `admin` with MFA enabled can sign in (password + TOTP or backup code) and reach `/admin`, which shows their user name.
- [ ] An `admin` without MFA is guided through enrollment, receives 10 backup codes once, and can then sign in with MFA.
- [ ] A `manager` can sign in (with or without MFA). A `user`-role account sees "no access", ends up with no session cookie, and has its token revoked.
- [ ] The bearer token never appears in client JS, HTML, or non-httpOnly storage. The cookie is httpOnly, SameSite=Lax, Secure in production, and has a 60-minute max-age.
- [ ] Unauthenticated `/admin/**` requests redirect to `/admin/login`. A `401` from the API clears the cookie and lands on `/admin/login?reason=expired`.
- [ ] Logout revokes the token on the API, clears the cookie, and redirects to login.
- [ ] The API sees the real client IP for BFF requests. Verified by unit test and a post-deploy manual check.
- [ ] `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass in the front, and the back test suite passes.
- [ ] The ROADMAP token-strategy decision is ticked with its outcome, and feature 5 is marked done.

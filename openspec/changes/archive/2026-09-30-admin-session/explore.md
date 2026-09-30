# Exploration: Admin session (feature 5, both repos)

## Settled decisions

- BFF: Next.js server code (Server Actions / server components) calls the API; the JWT lives only in an httpOnly, Secure, SameSite=Lax cookie. The browser never sees the bearer token.
- No refresh token in this feature.
- MFA is mandatory for `admin`; optional for `manager`.

## Backend auth contract (already implemented in `back-siricmanpropiedades/src/auth/`)

- `POST /api/auth/login` (public, 5 req/min per IP + per-account lockout of 5 failures / 15 min keyed by `userName`). Body `{ userName, password }`. Responses:
  1. Full session: `{ id, userName, isActive, roles: string[], token }`.
  2. `{ mfaRequired: true, mfaToken }` — MFA enabled; `mfaToken` scoped `mfa_verify`, 5 min.
  3. `{ mfaSetupRequired: true, setupToken }` — admin without MFA; `setupToken` scoped `mfa_setup`, 15 min.
  - Errors: `401 "Invalid credentials"` (identical for every failure, anti-enumeration); `429` for IP throttle or account lockout (no `Retry-After`).
- `POST /api/auth/mfa/enable` — bearer = full-session or `mfa_setup` token, body `{ password }` → `{ secret, otpauthUrl }`. 5/min.
- `POST /api/auth/mfa/confirm` — same auth, body `{ code }` → `{ backupCodes: string[10] }` (shown once). 5/min.
- `POST /api/auth/mfa/verify` — public, body `{ mfaToken, code }` (6-digit TOTP or backup code) → full-session shape. `mfaToken` revoked on use. 5/min.
- `POST /api/auth/mfa/disable` — full session, `{ password, code }`; `400` for admin.
- `GET /api/auth/check-status` — ROTATES the token (revokes the caller's `jti`, issues a new one). Not a passive whoami.
- `POST /api/auth/logout` — revokes the current token by `jti`.
- JWT payload `{ id, jti, scope? }` only (no userName/roles). HS256, `JWT_EXPIRES_IN` = 60m. `JwtStrategy` reads only `Authorization: Bearer`. `JwtStrategy` does not check MFA per request (MFA gates issuance only).

## Client-IP / throttling

- `TRUST_PROXY=1`; only Caddy publishes ports; `api` and `web` are Docker-network-only.
- Global `ThrottlerGuard` 20 req/min per IP on every route; auth routes 5/min.
- With a BFF, every admin request reaches the API from the Next server. Without forwarding the real client IP, all admins share one bucket and lock each other out.

## Front

- Next.js 16 App Router, React 19, CSS Modules + CSS custom-property tokens (`src/app/globals.css`), fonts Bodoni Moda / Manrope, Vitest + Testing Library, `output: "standalone"`.
- No admin routes, no `middleware.ts`, no API client yet.
- Next Route Handlers have no automatic Origin check; Server Actions do (CSRF protection).

## Orchestrator decisions on open questions (user delegated all decisions)

1. The BFF calls the API over the internal Docker network: new server-only env var `API_INTERNAL_URL` (e.g. `http://api:3000`), wired in `deploy/compose.yml` for the `web` service. Local dev points it at the local API.
2. `TRUST_PROXY` stays `1`. The BFF sets `X-Forwarded-For` to the real client IP it received from Caddy on the inbound request (Caddy overwrites XFF for untrusted clients). Safe because `api:3000` is not reachable from outside the compose network.
3. `middleware.ts` only checks cookie presence (UX redirect). Real validation happens on every data fetch against the API. `JWT_SECRET` is NOT shared with the front.
4. Add a non-rotating `GET /api/auth/me` to the back (full session required) returning `{ id, userName, isActive, roles }`, used by admin server components for display and as the session check.
5. Expiry UX is reactive: any `401` from the API clears the cookie and redirects to `/admin/login?reason=expired`. Cookie max-age matches the JWT lifetime (60 min).
6. Screens needed: login, MFA verify (TOTP or backup code), first-time MFA enrollment (password re-entry → QR + manual secret → confirm code → one-time backup codes). The Claude Design admin-panel project was unavailable (HTTP 503) at planning time; use the public-site brand tokens and align visuals in feature 6.
7. Mutations (login, MFA verify/enable/confirm, logout) are Server Actions to inherit Next's built-in Origin checking.

## Risks

- `check-status` must never be used for periodic reads (rotation race logs users out).
- Throttle collision if the IP forwarding is wrong; needs an end-to-end check.
- Deploy: new `API_INTERNAL_URL` env on the `web` service; the user applies compose changes on the server.

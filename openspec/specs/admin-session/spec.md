# Admin Session Specification

## Purpose

Admin authentication for the Next.js panel, implemented as a Backend-For-Frontend (BFF). The Next server holds the API bearer token in an httpOnly cookie; the browser never sees it. This spec covers the login, MFA verification, and MFA enrollment flows, session-cookie handling, route protection, the `admin`/`manager` role gate, logout, client-IP forwarding to the API, and the authenticated `/admin` landing page.

## Requirements

### Requirement: Admin Login

The system MUST provide a `/admin/login` screen with username and password fields, submitted through a Server Action that calls `POST /api/auth/login` on the internal API.

The Server Action MUST branch on the three possible response shapes from `POST /api/auth/login`:
- Full session (`{ id, userName, isActive, roles, token }`): the system MUST apply the role gate (see "Role Gate for Admin Panel Access") and, if the gate passes, set the session cookie and redirect to `/admin`.
- `{ mfaRequired: true, mfaToken }`: the system MUST store `mfaToken` in a short-lived cookie and redirect to the MFA verification screen.
- `{ mfaSetupRequired: true, setupToken }`: the system MUST store `setupToken` in a short-lived cookie and redirect to the MFA enrollment flow.

The system MUST show a single generic invalid-credentials message for any `401` response, regardless of whether the username does not exist, the password is wrong, or the account is inactive.

The system MUST show a throttle/lockout message for any `429` response, without exposing whether the block is the per-IP rate limit or the per-account lockout.

#### Scenario: Full session on first factor (no MFA)

- GIVEN a `manager` account without MFA enabled
- WHEN the user submits valid credentials at `/admin/login`
- THEN the Server Action receives a full-session response from the API
- AND the role gate is applied and passes
- AND the session cookie is set
- AND the user is redirected to `/admin`

#### Scenario: MFA required

- GIVEN an account with MFA enabled
- WHEN the user submits valid credentials at `/admin/login`
- THEN the Server Action receives `{ mfaRequired: true, mfaToken }`
- AND a short-lived `mfaToken` cookie is set
- AND the user is redirected to the MFA verification screen
- AND no session cookie is set yet

#### Scenario: MFA setup required (admin without MFA)

- GIVEN an `admin` account without MFA enabled
- WHEN the user submits valid credentials at `/admin/login`
- THEN the Server Action receives `{ mfaSetupRequired: true, setupToken }`
- AND a short-lived `setupToken` cookie is set
- AND the user is redirected to the MFA enrollment flow
- AND no session cookie is set yet

#### Scenario: Invalid credentials

- GIVEN any account state (nonexistent username, wrong password, or inactive account)
- WHEN the user submits credentials that the API rejects with `401`
- THEN the login screen shows the generic "invalid credentials" message
- AND no cookie is set

#### Scenario: Rate limited or locked out

- GIVEN the per-IP login rate limit or the per-account lockout has been reached
- WHEN the user submits credentials and the API responds `429`
- THEN the login screen shows the throttle/lockout message
- AND no cookie is set

### Requirement: MFA Verification

The system MUST provide an MFA verification screen that accepts either a 6-digit TOTP code or a backup code, submitted through a Server Action that calls `POST /api/auth/mfa/verify` with the `mfaToken` read from its cookie.

On success (full-session response), the system MUST apply the role gate and, if it passes, set the session cookie, clear the `mfaToken` cookie, and redirect to `/admin`.

On a wrong code, the system MUST show an error on the verification screen and MUST NOT set the session cookie.

If the `mfaToken` is expired, invalid, or already used, the system MUST send the user back to `/admin/login` rather than showing a stale verification screen.

#### Scenario: Successful TOTP verification

- GIVEN a valid `mfaToken` cookie from a prior login
- WHEN the user submits the correct 6-digit TOTP code
- THEN the API returns the full-session shape
- AND the role gate is applied and passes
- AND the session cookie is set
- AND the `mfaToken` cookie is cleared
- AND the user is redirected to `/admin`

#### Scenario: Successful backup code verification

- GIVEN a valid `mfaToken` cookie from a prior login
- WHEN the user submits a valid unused backup code instead of a TOTP code
- THEN the API returns the full-session shape
- AND the same success handling as TOTP verification applies

#### Scenario: Wrong code

- GIVEN a valid `mfaToken` cookie
- WHEN the user submits an incorrect code
- THEN the verification screen shows an error message
- AND no session cookie is set
- AND the `mfaToken` cookie is left as-is so the user can retry within its remaining lifetime

#### Scenario: Expired or invalid mfaToken

- GIVEN an `mfaToken` cookie that is missing, expired, or already consumed
- WHEN the user attempts MFA verification
- THEN the API rejects the request
- AND the system redirects the user back to `/admin/login`
- AND any stale `mfaToken` cookie is cleared

### Requirement: MFA Enrollment

The system MUST provide a first-time MFA enrollment flow for `admin` accounts without MFA enabled, driven by the `setupToken` cookie, in this order:

1. Re-enter the password.
2. Show the QR code (rendered server-side from `otpauthUrl`) and the manual secret for accounts that cannot scan it.
3. Confirm a 6-digit TOTP code generated from the enrolled authenticator.
4. Show the one-time backup codes returned by the API, requiring an explicit "I saved them" acknowledgement before continuing.

The password re-entry step MUST call `POST /api/auth/mfa/enable` with the `setupToken` and the submitted password, and MUST show the returned `secret` and `otpauthUrl` (as a QR code) on success.

The confirmation step MUST call `POST /api/auth/mfa/confirm` with the `setupToken` and the submitted code, and MUST show the returned backup codes on success.

Because MFA confirmation returns only backup codes (not a session), enrollment MUST end by redirecting the user to `/admin/login` to complete a full MFA-verified sign-in. The system MUST NOT set a session cookie directly from the enrollment flow.

The system MUST clear the `setupToken` cookie once enrollment completes (success or the user abandoning the flow via an expired token).

#### Scenario: Full enrollment success

- GIVEN an `admin` account without MFA enabled, holding a valid `setupToken` cookie
- WHEN the user re-enters their password successfully
- THEN the system shows the QR code and manual secret
- WHEN the user submits the correct confirmation code
- THEN the system shows the 10 one-time backup codes
- WHEN the user acknowledges having saved the backup codes
- THEN the `setupToken` cookie is cleared
- AND the user is redirected to `/admin/login`
- AND no session cookie has been set at any point during enrollment

#### Scenario: Wrong password on re-entry

- GIVEN a valid `setupToken` cookie
- WHEN the user submits an incorrect password on the re-entry step
- THEN the system shows an error on that step
- AND the QR code and secret are not shown
- AND the `setupToken` cookie is left intact for retry within its remaining lifetime

#### Scenario: Wrong confirmation code

- GIVEN the user has passed password re-entry and sees the QR/secret step
- WHEN the user submits an incorrect confirmation code
- THEN the system shows an error on the confirmation step
- AND backup codes are not shown
- AND no session cookie is set

#### Scenario: Expired setupToken

- GIVEN a `setupToken` cookie that has expired (past its 15-minute lifetime) or is invalid
- WHEN the user attempts any enrollment step
- THEN the API rejects the request
- AND the system redirects the user back to `/admin/login`
- AND any stale `setupToken` cookie is cleared

### Requirement: Session Cookie Properties

The system MUST store the API bearer token only in an httpOnly cookie. The system MUST NOT expose the bearer token to client-side JavaScript, inline HTML, `localStorage`, `sessionStorage`, or any non-httpOnly storage mechanism.

The session cookie MUST have:
- `httpOnly: true`
- `sameSite: "lax"`
- `secure: true` when running in production, and MAY be non-secure in non-production environments to allow local HTTP development
- a `path` scoped to `/admin`
- a `max-age` matching the 60-minute JWT lifetime issued by the API

The `mfaToken` and `setupToken` MUST each be stored in their own short-lived httpOnly cookie, scoped to `/admin`, with the same `sameSite`/`secure` properties as the session cookie, and a `max-age` matching their respective server-side token lifetimes (5 minutes for `mfaToken`, 15 minutes for `setupToken`). These pending-token cookies MUST NOT be readable by client-side JavaScript.

#### Scenario: Session cookie set after full sign-in

- GIVEN a user who completes login (with or without MFA)
- WHEN the session cookie is set
- THEN it is httpOnly, `SameSite=Lax`, scoped to `/admin`
- AND it is `Secure` when the app is running in production
- AND its max-age matches the 60-minute JWT lifetime

#### Scenario: Bearer token never reaches the client

- GIVEN any authenticated admin page render
- WHEN the resulting HTML and any client-side JavaScript bundle are inspected
- THEN the bearer token does not appear in the HTML body, inline scripts, or any client-readable cookie, header, or storage

#### Scenario: Pending-token cookies are short-lived and httpOnly

- GIVEN a login that returns `mfaRequired` or `mfaSetupRequired`
- WHEN the corresponding pending-token cookie is set
- THEN it is httpOnly and inaccessible to client-side JavaScript
- AND its max-age does not exceed the server-side token lifetime (5 minutes for `mfaToken`, 15 minutes for `setupToken`)

### Requirement: Route Protection Middleware

The system MUST run a route-protection proxy (`src/proxy.ts`, the Next.js 16 name for middleware) that performs a cookie-presence check only (no JWT verification) on every request under `/admin/**`.

If the session cookie is absent, the proxy MUST redirect the request to `/admin/login`.

If the session cookie is present and the request targets `/admin/login`, the proxy MUST redirect to `/admin`.

The middleware MUST NOT be the source of truth for authorization; actual session validity is established server-side on each data fetch (see "Server-Side Session Validation").

#### Scenario: Unauthenticated request to a protected route

- GIVEN no session cookie is present
- WHEN a request is made to any `/admin/**` route other than `/admin/login`
- THEN the proxy redirects to `/admin/login`

#### Scenario: Authenticated visit to the login page

- GIVEN a session cookie is present
- WHEN a request is made to `/admin/login`
- THEN the proxy redirects to `/admin`

#### Scenario: Cookie present but expired server-side

- GIVEN a session cookie is present but the underlying token has expired or been revoked on the API
- WHEN a request is made to an `/admin/**` route
- THEN the proxy allows the request through (cookie presence only)
- AND the subsequent server-side `/auth/me` call enforces reactive expiry (see "Server-Side Session Validation")

### Requirement: Server-Side Session Validation

Every authenticated admin page MUST validate the session server-side by calling `GET /api/auth/me` through the server-only API client, rather than trusting the proxy's cookie-presence check.

If `GET /api/auth/me` responds with `401` (missing, expired, revoked, or otherwise invalid token), the system MUST clear the session cookie and redirect to `/admin/login?reason=expired`.

The `/admin/login?reason=expired` state MUST show a visible message indicating the session expired, distinct from the generic invalid-credentials message.

#### Scenario: Valid session

- GIVEN a session cookie backed by a valid, non-expired, non-revoked token
- WHEN an admin page calls `/auth/me`
- THEN the call succeeds with the user's `{ id, userName, isActive, roles }`
- AND the page renders normally

#### Scenario: Expired or revoked session

- GIVEN a session cookie backed by a token that has expired or been revoked (e.g. after logout elsewhere, or server-side revocation)
- WHEN an admin page calls `/auth/me` and receives `401`
- THEN the session cookie is cleared
- AND the user is redirected to `/admin/login?reason=expired`
- AND the login screen shows a visible expired-session message

### Requirement: Role Gate for Admin Panel Access

Only accounts holding the `admin` or `manager` role MAY access `/admin`. The role gate MUST be evaluated on every path that establishes or re-confirms a session: at login/MFA-verify success, and whenever `/auth/me` is consulted.

If a `user`-role account authenticates (directly, or by completing MFA), the system MUST NOT keep a session for it: it MUST revoke the token via `POST /api/auth/logout`, MUST clear or never set the session cookie, and MUST show a "no access" message instead of entering `/admin`.

If `/auth/me` later returns a user whose current roles contain none of `admin`/`manager` (e.g. role was changed after the cookie was issued), the system MUST apply the same clearing behavior: revoke the token, clear the cookie, and redirect with a "no access" message.

#### Scenario: Admin or manager reaches the panel

- GIVEN an account with the `admin` or `manager` role that completes authentication (with or without MFA)
- WHEN the role gate is evaluated
- THEN the session cookie is set
- AND the user reaches `/admin`

#### Scenario: User-role account is denied at authentication

- GIVEN an account with only the `user` role
- WHEN it completes login (or login + MFA verification) successfully at the API level
- THEN the system calls `POST /api/auth/logout` to revoke the issued token
- AND no session cookie is kept (cleared if any was set, never set otherwise)
- AND the user sees a "no access" message
- AND the user does not reach `/admin`

#### Scenario: Role revoked mid-session

- GIVEN a session cookie was issued while the account held the `manager` role, and the role was later removed
- WHEN `/auth/me` is called and returns roles that no longer include `admin` or `manager`
- THEN the token is revoked, the cookie is cleared, and the user is redirected away from `/admin` with a "no access" message

### Requirement: Logout

The system MUST provide a logout Server Action, triggered from the authenticated `/admin` landing page, that calls `POST /api/auth/logout` to revoke the current token on the API.

The system MUST clear the session cookie regardless of the API logout call's outcome (success or failure), and MUST redirect to `/admin/login` afterward.

#### Scenario: Successful logout

- GIVEN an authenticated session
- WHEN the user triggers logout
- THEN the API revokes the token by `jti`
- AND the session cookie is cleared
- AND the user is redirected to `/admin/login`

#### Scenario: Logout despite API failure

- GIVEN an authenticated session
- WHEN the user triggers logout and the API call to revoke the token fails or is unreachable
- THEN the session cookie is still cleared
- AND the user is still redirected to `/admin/login`

### Requirement: Client IP Forwarding

The server-only API client MUST forward the real client IP as the `X-Forwarded-For` header on every outbound request to the internal API, derived from the IP that Caddy attached to the inbound request reaching the Next server.

This forwarding MUST apply to every authenticated and unauthenticated call the BFF makes to the API (login, MFA endpoints, `/auth/me`, logout), so that the API's per-IP throttling (5/min on auth routes, 20/min globally) attributes requests to the real originating client rather than to the Next server's own address.

#### Scenario: Two admins behind different IPs

- GIVEN two different admin users on two different client IPs, both interacting with the panel through the same Next server
- WHEN each makes requests that reach the API (e.g. login attempts)
- THEN each user's requests carry their own real IP in `X-Forwarded-For`
- AND the API's per-IP throttle buckets them independently

#### Scenario: Missing inbound IP

- GIVEN the inbound request to the Next server has no discoverable client IP (unexpected proxy misconfiguration)
- WHEN the API client makes an outbound request
- THEN the system does not silently omit IP forwarding logic; the resulting request is made with the best available IP information rather than a hardcoded or empty value

### Requirement: Authenticated Admin Landing Page

The system MUST provide `/admin` as a server component that, once the `(panel)` layout has established the session via `/auth/me`, redirects to the property list at `/admin/propiedades` (feature 6). The authenticated user's `userName` and a logout control wired to the logout Server Action MUST be shown in the panel shell rendered by that layout, rather than on `/admin` itself.

#### Scenario: Landing page redirects to the property list

- GIVEN a valid, role-gated session
- WHEN `/admin` is rendered
- THEN the system redirects to `/admin/propiedades`
- AND the panel shell shows the authenticated user's `userName`
- AND a logout button is present and wired to the logout Server Action

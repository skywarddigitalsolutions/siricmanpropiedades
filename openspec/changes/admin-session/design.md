# Design: Admin session (login + MFA from Next, BFF token strategy)

## Technical Approach

The front becomes a thin BFF for the admin panel. All API traffic for `/admin/**` runs on the Next.js server; the browser only holds httpOnly cookies and receives rendered UI.

- **Back (slice 1).** Add a non-rotating `GET /api/auth/me` guarded by the existing `@Auth()`. That decorator already rejects scoped tokens, because `JwtStrategy.validate` throws on any `scope`. The endpoint returns public user fields only. The slice also wires `API_INTERNAL_URL` into the `web` service and documents it in the Spanish runbook.
- **Front transport (slice 2).** Three pieces:
  - A `server-only` HTTP client (`src/lib/api/`). It builds `${API_INTERNAL_URL}/api/<path>`, attaches the bearer token, and forwards the real client IP from the inbound request's `X-Forwarded-For`. It maps non-2xx responses to a typed `ApiError`.
  - A session layer (`src/lib/session/`). It owns cookie read/write/clear, the role gate, and the 401-to-expiry mapping.
  - A Next 16 `src/proxy.ts`. This is the renamed `middleware.ts`; see ADR-3. It does cookie-presence redirects only.
- **Front screens (slices 3–5).** Server Components pages under `src/app/admin/`, in two route groups: `(auth)` for the public login, MFA verify, and MFA setup pages, and `(panel)` for the protected landing. Every mutation is a Server Action that the page passes as a prop to a small client form using `useActionState` (a container/presentational split).

This maps one-to-one to the proposal's approach and slice plan. The specs (`specs/admin-session/spec.md` in the front and `specs/auth-session-read/spec.md` targeting the back) are written in parallel. The requirement names below follow the proposal's success criteria.

## Architecture Decisions

### ADR-1: `GET /api/auth/me` reuses `@Auth()` with no roles

**Choice**: Add `@Get('me') @Auth() @Header('Cache-Control', 'no-store') me(@GetUser() user: User)` to `AuthController`. It returns `this.authService.toSessionUser(user)`. `toSessionUser` is a new public service method that returns `{ id, userName, isActive, roles }`. `buildSessionResponse` and `checkAuthStatus` are refactored to spread it: `{ ...this.toSessionUser(user), token }`.

**Alternatives considered**:
- A dedicated guard that checks scope. Rejected because `AuthGuard('jwt')` → `JwtStrategy.validate` already throws `401` for any `scope` (`mfa_verify`/`mfa_setup`), for revoked `jti`, for a missing user, and for an inactive user. The existing `jwt.strategy.spec.ts` covers all of these.
- Restricting it with `@Auth(admin, manager)`. Rejected because the front must still learn the roles of a `user` account to show "no access" and revoke it. A `403` would hide that. The panel role gate lives in the BFF.
- Reusing `check-status`. Rejected because it rotates (revokes) the token.

**Rationale**: This is the smallest change that gives the exact guarantees the spec needs: full session only, no revocation, no reissue. Guard and role requirement (back `rules.design`): `AuthGuard('jwt')` + `UserRoleGuard` with an empty role list, so any authenticated full-session role passes. The global `ThrottlerGuard` (20/min per IP) still applies. No entity or migration changes.

### ADR-2: Session cookies — names, options, lifetimes

**Choice**: Three plain-named httpOnly cookies, all scoped to `path: "/admin"`:

| Cookie | Content | maxAge (s) | Cleared when |
|---|---|---|---|
| `siricman_admin_session` | full-session JWT | 3600 (the JWT lifetime of 60 min) | logout, 401, role-gate failure, `reason=expired\|forbidden` |
| `siricman_admin_mfa` | `mfaToken` (`mfa_verify`) | 300 | successful verify, new login, clear-all |
| `siricman_admin_setup` | `setupToken` (`mfa_setup`) | 900 | successful confirm, new login, clear-all |

The options come from one function: `{ httpOnly: true, sameSite: "lax", path: "/admin", secure: process.env.NODE_ENV === "production", maxAge }`. Deletion uses `set(name, "", { ...sameOptions, maxAge: 0 })`, so the path always matches.

**Alternatives considered**:
- The `__Host-` prefix. Rejected: it requires `Path=/` and `Secure`, which conflicts with the `/admin` scoping and with local HTTP dev.
- The `__Secure-` prefix. Rejected: it breaks non-production HTTP, and a name that changes by environment complicates the proxy.
- Deriving `maxAge` from the JWT `exp`. Rejected: it adds token parsing in the front for little gain, because reactive expiry covers any drift.
- One cookie holding JSON with every token. Rejected: it mixes lifetimes.

**Rationale**: `SameSite=Lax` plus the Server Actions Origin check covers CSRF. `/admin` scoping keeps the token off public-site requests. `Secure` depends on the environment, as the proposal requires. The Dockerfile runner sets `NODE_ENV=production`, so the image always emits `Secure` behind Caddy's HTTPS. The names live in `src/lib/session/cookie-names.ts`, a module with **no** `server-only` import, because `proxy.ts` imports it (ADR-3).

### ADR-3: Next 16 `proxy.ts` (not `middleware.ts`), cookie presence only

**Choice**: `src/proxy.ts` exports `proxy(request: NextRequest)` with `config.matcher = ["/admin/:path*"]`. It follows these rules, in order:
1. **Expiry clearing.** For `/admin/login` with `reason` ∈ {`expired`, `forbidden`}, return `NextResponse.next()` and expire all three cookies on the response.
2. **Already signed in.** For `/admin/login` with a session cookie and no `reason`, redirect to `/admin`.
3. **Unauthenticated.** For a protected path (anything except `/admin/login`, `/admin/mfa`, and `/admin/mfa/setup`) with no session cookie, redirect to `/admin/login`.
4. Otherwise, return `NextResponse.next()`.

**Evidence (installed `next@16.3.6`)**: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` states that "`middleware` is deprecated and has been renamed to `proxy`" in v16.0.0. It also says "Proxy defaults to the Node.js runtime", and that `runtime` config in the proxy file throws. `middleware.md` confirms the deprecation. The proposal's `middleware.ts` is therefore implemented as `src/proxy.ts`, which sits at the same level as `app`.

**Alternatives considered**:
- `middleware.ts`. Rejected: it is deprecated in the installed version.
- JWT verification in the proxy. Rejected, as the proposal excludes it: that would need `JWT_SECRET` in the front.
- Protection in the layout only. Rejected: the proxy gives a fast redirect without rendering.

**Rationale**: The proxy is UX only. The docs themselves warn that Server Functions must verify auth on their own ("Always verify authentication and authorization inside each Server Function rather than relying on Proxy alone"). So every protected Server Component and Server Action goes through the session layer, which calls `/auth/me` or requires the token. Rule 1 is the key piece: Server Components cannot delete cookies, since `cookies().set/delete` only works in Server Functions and Route Handlers (see `cookies.md`). The proxy is therefore the single place that clears a stale cookie after a Server Component detects a 401. It also breaks the "stale cookie → `/admin/login` → proxy sends back to `/admin`" loop, because rule 2 skips any request that carries a `reason`. There is **no** `returnTo`/`next` parameter; post-login always goes to `/admin`. This removes any open-redirect surface.

### ADR-4: Client IP forwarding (`X-Forwarded-For`)

**Choice**: `getClientIp(h: Headers): string | undefined` in `src/lib/api/client-ip.ts` works like this:
- It reads the inbound `x-forwarded-for` via `await headers()`, splits on commas, trims, and takes the **rightmost** non-empty entry.
- It accepts the value only if `net.isIP(value) !== 0`.
- The API client sets outbound `X-Forwarded-For: <that ip>`, with one value and no appended chain.
- If the value is missing or invalid, it omits the header and logs a single `console.warn` without the header value.

**Evidence**:
- Caddy: the Caddyfile has a bare `reverse_proxy web:3000` with no `trusted_proxies`. Per Caddy's `reverse_proxy` docs ("Defaults" section, v2.5+), Caddy ignores client-supplied `X-Forwarded-*` values unless the peer is in `trusted_proxies`, and sets `X-Forwarded-For` to the connecting client's IP. This is taken from the docs and has not been verified against the running binary; see the risks and the post-deploy check.
- Next: the installed `node_modules/next/dist/server/base-server.js:612` does `req.headers['x-forwarded-for'] ??= socket.remoteAddress`. So Next **preserves** Caddy's value and only fills it when it is absent, as in local dev with no Caddy.
- API: `TRUST_PROXY=1` makes Express trust one hop (the Next container), so `req.ip` is the last XFF entry, which is exactly the one value the BFF sets.

**Alternatives considered**:
- The leftmost entry. Rejected: that is the client-controlled end whenever any proxy appends.
- Forwarding the whole inbound chain. Rejected: it gives no benefit, and the API only reads the last hop.
- `X-Real-IP`. Rejected: Caddy does not set it by default.
- Changing the back's `TRUST_PROXY`. Out of scope.

**Rationale**: Each admin gets their own throttle bucket (auth 5/min, global 20/min). Spoofing needs a direct path to `web:3000` or `api:3000`, and neither publishes a port. IP validation stops header injection and garbage values.

### ADR-5: Layered server-only modules; the client does not touch cookies

**Choice**: There are three layers:
- **`src/lib/api/client.ts`.** Pure transport. `apiFetch<T>(path, { method, body, token })` returns parsed JSON or throws `ApiError { status, message }`. `status: 0` means network failure or timeout. It uses `cache: "no-store"`, `AbortSignal.timeout(10_000)`, and JSON headers. It reads `process.env.API_INTERNAL_URL` **at call time** and throws `Error("API_INTERNAL_URL is not configured")` if the variable is unset.
- **`src/lib/api/auth.ts`.** Typed endpoint functions and response type guards.
- **`src/lib/session/*`.** The only layer that knows cookies, redirects, and roles. `401` on an **authenticated** call (session token) → `redirect("/admin/login?reason=expired")`. Inside Server Actions, cookies are cleared explicitly first, and the proxy clears them too, so this is belt and braces. `401` on a **pre-session** call (login, MFA verify/enable/confirm) → a form error, not expiry.

**Alternatives considered**:
- Putting cookie clearing and redirects inside the fetch wrapper, as the proposal worded it. Rejected: the same 401 means different things in login versus data reads, and the wrapper cannot clear cookies when it is called from a Server Component.
- Route Handlers as a `/api/*` proxy. Rejected: they have no built-in Origin check, and the proposal settles on Server Actions.

**Rationale**: The proposal's "401 → clear cookie + `/admin/login?reason=expired`" behavior is kept, but it is placed where it can actually run. Each layer can be unit tested with one mock boundary: `fetch` for the client, and the client module plus `next/headers` for the session and actions. `import "server-only"` goes in `client.ts`, `client-ip.ts`, `auth.ts`, `session/cookies.ts`, `session/dal.ts`, and `session/complete-session.ts`. Add the `server-only` npm package; it is not installed today.

### ADR-6: Login state machine and role gate in shared session code

**Choice**: `completeSession(session: FullSessionResponse): Promise<"ok" | "forbidden">` in `src/lib/session/complete-session.ts`:
- If `canAccessPanel(session.roles)` is true (`roles` includes `admin` or `manager`): set the session cookie, clear the pending cookies, and return `"ok"`.
- Otherwise: best-effort `POST /auth/logout` with that token (errors are swallowed), clear all cookies, and return `"forbidden"`. The session cookie is never set.

`loginAction` branches on the response shape: full session → `completeSession`; `mfaRequired` → set the mfa cookie, then `redirect("/admin/mfa")`; `mfaSetupRequired` → set the setup cookie, then `redirect("/admin/mfa/setup")`. `verifyMfaAction` → `completeSession`. `redirect(...)` is always called **outside** `try/catch`, as `redirect.md` requires ("redirect throws an error so it should be called outside the try block").

**Alternatives considered**:
- Gating by role in the proxy. Rejected: the proxy cannot see roles without JWT verification.
- Setting the cookie first and gating on `/admin`. Rejected: that would leave a live `user` token in the browser.

**Rationale**: One function enforces the gate on both paths that produce a full session. `canAccessPanel` lives in `src/lib/session/roles.ts`, which is pure and has no `server-only` import, so it is trivially unit-testable. The same gate runs in `getCurrentUser()` against `/auth/me` roles. On failure, that call revokes on a best-effort basis and redirects to `/admin/login?reason=forbidden`; the proxy then clears the cookies.

### ADR-7: Route layout — route groups, public chrome moved out of the root layout

**Choice**: Today the root `src/app/layout.tsx` renders the public `Header`, `Footer`, and `WhatsAppButton` around **every** route. Split it:
- `src/app/layout.tsx` keeps `<html>`, `<body>`, the fonts, `globals.css`, and the site metadata.
- A new `src/app/(site)/layout.tsx` renders the public chrome. `page.tsx`, `page.module.css`, and `page.test.tsx` move into `(site)/`. URLs are unchanged.
- `src/app/admin/layout.tsx` sets `metadata.robots = { index: false, follow: false }` and the admin shell background.

The route tree (S = Server Component, C = Client Component):

```
src/app/
  layout.tsx                    S  html/body/fonts only                 (modified)
  (site)/layout.tsx             S  Header + Footer + WhatsAppButton     (new)
  (site)/page.tsx               S  home (moved, unchanged)
  admin/
    layout.tsx                  S  noindex metadata, admin shell
    error.tsx                   C  "service unavailable" boundary (API down / env missing)
    (auth)/layout.tsx           S  centered AuthCard shell
    (auth)/login/page.tsx       S  reads searchParams.reason → <LoginForm action notice>
    (auth)/login/actions.ts        "use server": loginAction
    (auth)/mfa/page.tsx         S  requires mfa cookie (else redirect login) → <MfaVerifyForm>
    (auth)/mfa/actions.ts          "use server": verifyMfaAction
    (auth)/mfa/setup/page.tsx   S  requires setup cookie (else redirect login) → <MfaEnrollment>
    (auth)/mfa/setup/actions.ts    "use server": enableMfaAction, confirmMfaAction
    (panel)/layout.tsx          S  getCurrentUser() → <AdminHeader userName> + <LogoutButton action>
    (panel)/page.tsx            S  getCurrentUser() (React cache, deduped) → greeting
    (panel)/actions.ts             "use server": logoutAction
```

**Alternatives considered**:
- Multiple root layouts. Rejected: they force full page reloads between groups.
- Hiding the public chrome conditionally with `usePathname`. Rejected: it turns the layout into a client component.

**Rationale**: The admin needs no public chrome. Route groups keep URLs stable. The `(panel)` page calls `getCurrentUser()` itself as well as the layout, because layouts do not re-render on client navigation. `cache()` makes this a single `/auth/me` call per request.

### ADR-8: Forms — `useActionState`, pending states, accessible errors

**Choice**:
- **Container/presentational split.** The server pages import the actions and pass them as props to `"use client"` forms. Each form uses `const [state, formAction, pending] = useActionState(action, initialState)`.
- **Action state.** Each action has the signature `(prev: FormState, formData: FormData) => Promise<FormState>`, with `FormState = { error?: AuthErrorCode; fields?: { userName?: string } }`. The password is never echoed back.
- **Shared field and button components.** `SubmitButton` uses `useFormStatus` to set `disabled` and `aria-busy` and to show pending text. Errors render in a `FormAlert` with `role="alert"`. Inputs carry `aria-invalid` and `aria-describedby`.
- **Autocomplete hints.** `autoComplete="username"`, `"current-password"`, and `"one-time-code"`. The code field is free text of 6–10 chars, because backup codes are alphanumeric.
- **UI copy.** Neutral-register Spanish (the site is `lang="es"`), centralized in `src/components/admin/auth/messages.ts`.

Error-code mapping:

| Situation | Code | Message (neutral Spanish) |
|---|---|---|
| login 401 or 400 (DTO rejects the shape) | `invalid-credentials` | "Usuario o contraseña incorrectos." |
| any 429 (IP throttle or account lockout; no `Retry-After`) | `throttled` | "Demasiados intentos. Espere unos minutos e intente nuevamente." |
| full session without an allowed role | `no-access` | "Esta cuenta no tiene acceso al panel de administración." |
| verify/confirm 401 or 400 | `invalid-code` | "El código no es válido. Si el problema continúa, vuelva a iniciar sesión." (with a link) — see the verified note below for `verify` |
| enable 401 | `invalid-password` | "La contraseña no es correcta o la verificación expiró." |
| `ApiError.status === 0` or 5xx | `unavailable` | "El servicio no está disponible. Intente nuevamente en unos minutos." |
| empty required field (checked before any API call) | `validation` | "Complete todos los campos." |
| notice `reason=expired` | – | "Su sesión expiró. Inicie sesión nuevamente." |
| notice `reason=forbidden` | – | same text as `no-access` |

**MFA verify.** A 401 keeps the `mfa` cookie. The back only revokes `mfaToken` on success, so the user can retry within 5 minutes. A missing cookie in the action redirects to `/admin/login`.

**Verified correction (post-apply, `back-siricmanpropiedades` read directly):** `POST /api/auth/mfa/verify` returns `401` for *both* a wrong code and a rejected `mfaToken` — the table row above ("verify/confirm 401 or 400 → `invalid-code`") is not literally correct for `verify` on its own; the two cases share the same status and are distinguished only by the exception message. `MfaController.verify` (`src/auth/mfa/mfa.controller.ts:142`) throws exactly `UnauthorizedException('Invalid code')` for a wrong code, *before* revoking `mfaToken`, so the token stays valid for a retry. `AuthService.resolveUserFromToken`/`verifyToken` (`src/auth/auth.service.ts`) throw a `401` with one of `'Invalid or expired token'`, `'This token cannot be used for this operation'`, `'Token has been revoked'`, `'Token not valid'`, or `'User is not active'` whenever the `mfaToken` itself is rejected, before the code is even checked. The front (`verifyMfaAction`) matches on the exact message: only `401` + `"Invalid code"` → `invalid-code` (cookie kept); every other rejection → clear the cookie and redirect to `/admin/login?reason=expired`. This note applies to `verify` only — `confirm` (MFA enrollment, Phase 4, not yet implemented) has not been verified against the back the same way, and its row above should be re-checked before Phase 4's `confirmMfaAction` is implemented.

**Enrollment (`MfaEnrollment`, one client component with local step state).**
1. `enableMfaAction(password)` returns `{ step: "scan", qrSvgDataUri, secret }`.
2. The user scans the QR, or copies the secret shown in a `<code>`.
3. `confirmMfaAction(code)` returns `{ step: "codes", backupCodes }` and clears the setup cookie.
4. The component shows the 10 codes in a list. A "Los guardé" checkbox enables the link to `/admin/login`.
5. The codes live only in action state. A refresh loses them, and the page warns about that.

A setup-token 401 on confirm redirects to `/admin/login?reason=expired`. The setup token cannot be revoked, because `/auth/logout` rejects scoped tokens. Deleting the cookie is enough: the token dies within 15 minutes, and after MFA is enabled, `enable` and `confirm` both answer `400`.

**Alternatives considered**: `react-hook-form` or a client-side fetch. Rejected: they add a dependency, and they lose progressive enhancement and the Origin check.

**Rationale**: This follows the pattern documented in the installed `forms.md` (`useActionState`, `useFormStatus`) and works without JavaScript for the basic submit.

### ADR-9: QR rendering — `qrcode` on the server, embedded as an SVG data URI

**Choice**: Add the dependency `qrcode` and the dev dependency `@types/qrcode`. `src/lib/mfa/qr.ts` (server-only) exports `renderQrDataUri(otpauthUrl): Promise<string>` using `QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 1 })`. It returns `data:image/svg+xml;base64,...`, which renders through `<img alt="Código QR para la app de autenticación" width=200 height=200>`. `otpauthUrl` itself is not sent to the client, only the rendered QR and the secret for manual entry.

**Alternatives considered**:
- A third-party QR API or image URL. Rejected: it would leak the secret.
- `uqr`. Zero-dependency and smaller, but less widely adopted; an acceptable fallback if `qrcode`'s transitive dependencies are objectionable.
- `qrcode.react`. Rejected: it renders on the client, so the library would ship in the client bundle.
- `dangerouslySetInnerHTML` with an inline SVG. Rejected: the data URI in `<img>` needs no raw HTML injection.

**Rationale**: `qrcode` is the de-facto maintained Node QR library. It runs only on the server (a Server Action), so it adds nothing to the client bundle, and the `standalone` output traces it automatically. The apply phase must check the current version and its transitive dependencies (`npm view qrcode`) before adding it. They were not verifiable offline here.

### ADR-10: Test infrastructure for server code under strict TDD

**Choice**:
- `vitest.config.ts` gets `resolve.alias: { "server-only": "<root>/src/test/stubs/server-only.ts" }`, an empty module. Without it, the real package throws outside the `react-server` condition.
- Server-side test files start with `// @vitest-environment node`. Component tests keep jsdom.
- `src/test/next-server.ts` provides:
  - `createCookieStore(initial?)`: a Map-backed `get`, `has`, `set`, and `delete` that records options.
  - `mockRequestHeaders(init)`.
  - A `RedirectError` class plus `expectRedirect(promise, url)`.
  - Tests use them with `vi.mock("next/headers", () => ({ cookies: vi.fn(), headers: vi.fn() }))` and `vi.mock("next/navigation", () => ({ redirect: vi.fn((url) => { throw new RedirectError(url) }) }))`.
- API client tests use `vi.stubGlobal("fetch", vi.fn())` and assert the URL, method, headers (`Authorization`, `X-Forwarded-For`, `Content-Type`), body, and error mapping.
- Action tests mock `@/lib/api/auth` and `next/headers`.
- Proxy tests build `new NextRequest("http://localhost/admin/...", { headers: { cookie } })`, call `proxy()`, and assert `location` and the `set-cookie` expiries.
- Async Server Component pages are **not** rendered directly; the installed `vitest.md` says Vitest does not support async Server Components. Their logic is kept in tested DAL functions, and they render tested sync presentational components. A thin page may be smoke-tested with `render(await Page(props))` only if its tree has no nested async components.

**Alternatives considered**:
- MSW. Rejected: it is a new dependency, and one `fetch` stub is enough for a single upstream.
- Relying on the real `next/navigation` `redirect` digest format. Rejected: it is an internal and brittle format.

**Rationale**: Each layer has one mock seam. RED tests can be written before the code in every slice.

## Data Flow

### Login (full session or MFA)

```
Browser ──POST (Server Action, Origin-checked)──▶ Caddy ──(XFF=client ip)──▶ web: loginAction
  loginAction ──apiFetch POST /api/auth/login, X-Forwarded-For: <client ip>──▶ api:3000
     ├─ { token, roles }        → completeSession ─┬─ admin|manager → set session cookie → redirect /admin
     │                                             └─ other role    → POST /auth/logout(token), clear → state{no-access}
     ├─ { mfaRequired, mfaToken }       → set mfa cookie (300s)   → redirect /admin/mfa
     ├─ { mfaSetupRequired, setupToken } → set setup cookie (900s) → redirect /admin/mfa/setup
     └─ ApiError 401/400 → invalid-credentials | 429 → throttled | 0/5xx → unavailable
```

### Authenticated read and reactive expiry

```
GET /admin ─▶ proxy: session cookie? ──no──▶ 307 /admin/login
                     │yes
                     ▼
         (panel)/layout + page ─▶ getCurrentUser() [React cache]
                     ─▶ apiFetch GET /api/auth/me (Bearer, XFF)
                         ├─ 200 roles ok      → render userName
                         ├─ 200 role not ok   → best-effort logout → redirect /admin/login?reason=forbidden
                         └─ 401               → redirect /admin/login?reason=expired
/admin/login?reason=… ─▶ proxy rule 1: NextResponse.next() + expire all 3 cookies ─▶ login page shows notice
```

### Logout

```
LogoutButton form ─▶ logoutAction ─▶ POST /api/auth/logout (Bearer; errors ignored)
                                  ─▶ clear all cookies (always) ─▶ redirect /admin/login
```

### Enrollment

```
/admin/mfa/setup (setup cookie) ─▶ enableMfaAction(password) ─▶ POST /auth/mfa/enable (Bearer setupToken)
   ─▶ { secret, otpauthUrl } ─▶ renderQrDataUri ─▶ state{scan, qr, secret}
   ─▶ confirmMfaAction(code) ─▶ POST /auth/mfa/confirm ─▶ { backupCodes } ─▶ clear setup cookie ─▶ state{codes}
   ─▶ "Los guardé" ─▶ link /admin/login ─▶ normal login ─▶ mfaRequired ─▶ verify
```

## File Changes

### Slice 1 — back (`back-siricmanpropiedades`)

| File | Action | Description |
|---|---|---|
| `src/auth/auth.controller.ts` | Modify | Add `GET me` with `@Auth()`, `@Header('Cache-Control','no-store')`, and Swagger `@ApiOperation`/`@ApiResponse`; returns `authService.toSessionUser(user)` |
| `src/auth/auth.service.ts` | Modify | Add public `toSessionUser(user)`; `buildSessionResponse`/`checkAuthStatus` reuse it |
| `src/auth/auth.service.spec.ts` | Modify | `toSessionUser` maps fields and roles; does not call `sign`/`revokedTokenRepository.save` |
| `src/auth/auth.controller.spec.ts` | Create | Guard metadata on `me` (`AuthGuard('jwt')`, `UserRoleGuard`), empty `META_ROLES`, delegates to `toSessionUser`, never calls `logout`/`checkAuthStatus` |
| `deploy/compose.yml` | Modify | `web.environment.API_INTERNAL_URL: http://api:3000` |
| `deploy/README.md` | Modify | New section "7. Panel de administración: sesión" (text below) |

Port evidence: the Caddyfile uses `reverse_proxy api:3000`, and `main.ts` listens on `PORT ?? 3000`. The back has no e2e infrastructure (no `test/` directory and no supertest), so the proposal's "e2e" is covered by unit tests plus the existing `jwt.strategy.spec.ts` scope, revocation, and inactive cases.

### Slice 2 — front transport and session foundation

| File | Action | Description |
|---|---|---|
| `package.json` | Modify | Add `server-only` |
| `vitest.config.ts` | Modify | `server-only` alias to the stub |
| `src/test/stubs/server-only.ts` | Create | Empty module |
| `src/test/next-server.ts` | Create | Cookie store fake, headers fake, `RedirectError`, `expectRedirect` |
| `src/lib/api/client-ip.ts` (+ `.test.ts`) | Create | `getClientIp(headers)` |
| `src/lib/api/client.ts` (+ `.test.ts`) | Create | `apiFetch`, `ApiError`, base URL from env |
| `src/lib/api/auth.ts` (+ `.test.ts`) | Create | `login`, `verifyMfa`, `enableMfa`, `confirmMfa`, `logout`, `getMe`, type guards |
| `src/lib/session/cookie-names.ts` | Create | Names, max-ages, path (no `server-only`) |
| `src/lib/session/cookies.ts` (+ `.test.ts`) | Create | `cookieOptions`, get/set/clear helpers |
| `src/lib/session/roles.ts` (+ `.test.ts`) | Create | `PANEL_ROLES`, `canAccessPanel` |
| `src/proxy.ts` (+ `proxy.test.ts`) | Create | ADR-3 rules |
| `src/app/layout.tsx` | Modify | Remove the public chrome (ADR-7) |
| `src/app/(site)/layout.tsx` | Create | Public chrome |
| `src/app/page.tsx`, `page.module.css`, `page.test.tsx` | Move | To `src/app/(site)/` (unchanged) |
| `README.md` | Modify | "Environment variables" section: `API_INTERNAL_URL` (server-only, read at runtime; local dev points at the local API, e.g. `http://localhost:3001` when the API runs with `PORT=3001`, since `next dev` takes 3000); no `JWT_SECRET` in the front; admin routes section |

### Slice 3 — login and MFA verify

| File | Action | Description |
|---|---|---|
| `src/lib/session/complete-session.ts` (+ test) | Create | ADR-6 |
| `src/app/admin/layout.tsx` | Create | noindex, shell |
| `src/app/admin/(auth)/layout.tsx` | Create | `AuthCard` shell |
| `src/app/admin/(auth)/login/page.tsx`, `actions.ts` (+ `actions.test.ts`) | Create | Login state machine |
| `src/app/admin/(auth)/mfa/page.tsx`, `actions.ts` (+ `actions.test.ts`) | Create | Verify |
| `src/components/admin/auth/AuthCard/*` | Create | Presentational card (CSS Module, tokens) |
| `src/components/admin/auth/LoginForm/*` | Create | Client form + test |
| `src/components/admin/auth/MfaVerifyForm/*` | Create | Client form + test |
| `src/components/admin/forms/SubmitButton/*`, `FormAlert/*`, `TextField/*` | Create | Shared form primitives + tests |
| `src/components/admin/auth/messages.ts` (+ test) | Create | Error/notice copy |

### Slice 4 — MFA enrollment

| File | Action | Description |
|---|---|---|
| `package.json` | Modify | `qrcode`, `@types/qrcode` (dev) |
| `src/lib/mfa/qr.ts` (+ test) | Create | `renderQrDataUri` |
| `src/app/admin/(auth)/mfa/setup/page.tsx`, `actions.ts` (+ `actions.test.ts`) | Create | enable/confirm |
| `src/components/admin/auth/MfaEnrollment/*` | Create | Step wizard (client) + test |
| `src/components/admin/auth/BackupCodes/*` | Create | Code list + acknowledgement + test |

### Slice 5 — landing, logout, feature close

| File | Action | Description |
|---|---|---|
| `src/lib/session/dal.ts` (+ test) | Create | `getSessionToken`, `getCurrentUser` (cache, 401/role handling) |
| `src/app/admin/(panel)/layout.tsx`, `page.tsx`, `actions.ts` (+ `actions.test.ts`) | Create | Landing, logout |
| `src/app/admin/error.tsx` | Create | Unavailable boundary |
| `src/components/admin/panel/AdminHeader/*`, `LogoutButton/*` | Create | Presentational + tests |
| `docs/ROADMAP.md` | Modify | Tick the token-strategy decision (BFF + httpOnly cookie, no refresh); mark feature 5 done |

The CSS Modules use only the existing tokens (`--color-navy`, `--color-gold`, `--color-bg`, `--radius-*`, `--shadow-card`, `--font-display`, `--font-body`); no new global tokens. Visual alignment with the admin design is deferred to feature 6.

## Interfaces / Contracts

### Back

```ts
// auth.controller.ts
@ApiOperation({ summary: 'Usuario de la sesión actual', description: 'No rota ni revoca el token.' })
@ApiResponse({ status: 200, description: '{ id, userName, isActive, roles }' })
@Get('me')
@Auth()
@Header('Cache-Control', 'no-store')
me(@GetUser() user: User) { return this.authService.toSessionUser(user); }

// auth.service.ts
toSessionUser(user: User): { id: string; userName: string; isActive: boolean; roles: string[] }
```

### Front

```ts
// src/lib/api/client.ts
export class ApiError extends Error { constructor(readonly status: number, message: string) }
export async function apiFetch<T>(
  path: `/${string}`,                       // e.g. "/auth/login" → `${API_INTERNAL_URL}/api/auth/login`
  opts?: { method?: "GET" | "POST"; body?: unknown; token?: string },
): Promise<T>;

// src/lib/api/auth.ts
export type SessionUser = { id: string; userName: string; isActive: boolean; roles: string[] };
export type FullSessionResponse = SessionUser & { token: string };
export type MfaRequiredResponse = { mfaRequired: true; mfaToken: string };
export type MfaSetupRequiredResponse = { mfaSetupRequired: true; setupToken: string };
export type LoginResponse = FullSessionResponse | MfaRequiredResponse | MfaSetupRequiredResponse;
export function isMfaRequired(r: LoginResponse): r is MfaRequiredResponse;
export function isMfaSetupRequired(r: LoginResponse): r is MfaSetupRequiredResponse;
export function login(userName: string, password: string): Promise<LoginResponse>;
export function verifyMfa(mfaToken: string, code: string): Promise<FullSessionResponse>;
export function enableMfa(token: string, password: string): Promise<{ secret: string; otpauthUrl: string }>;
export function confirmMfa(token: string, code: string): Promise<{ backupCodes: string[] }>;
export function logout(token: string): Promise<void>;
export function getMe(token: string): Promise<SessionUser>;

// src/lib/session/*
export const SESSION_COOKIE = "siricman_admin_session";
export const MFA_PENDING_COOKIE = "siricman_admin_mfa";
export const SETUP_PENDING_COOKIE = "siricman_admin_setup";
export const ADMIN_COOKIE_PATH = "/admin";
export const SESSION_MAX_AGE = 3600, MFA_PENDING_MAX_AGE = 300, SETUP_PENDING_MAX_AGE = 900;
export function canAccessPanel(roles: readonly string[]): boolean;           // admin | manager
export function completeSession(s: FullSessionResponse): Promise<"ok" | "forbidden">;
export const getCurrentUser: () => Promise<SessionUser>;                    // redirects on 401/forbidden/no cookie

// Server Action state
export type AuthErrorCode =
  | "invalid-credentials" | "throttled" | "no-access" | "invalid-code"
  | "invalid-password" | "unavailable" | "validation";
export type FormState = { error?: AuthErrorCode; fields?: { userName?: string } };
export type EnrollmentState =
  | { step: "password"; error?: AuthErrorCode }
  | { step: "scan"; qrSvgDataUri: string; secret: string; error?: AuthErrorCode }
  | { step: "codes"; backupCodes: string[] };
```

### Env handling (`rules.design`)

- `API_INTERNAL_URL` is server-only. It has no `NEXT_PUBLIC_` prefix, so it is never inlined into client bundles. It is read from `process.env` at request time by the standalone `server.js`.
- Production sets it in `deploy/compose.yml`; no `.env` change is needed.
- Nothing in this change reads or prints `.env*` files. `JWT_SECRET` stays back-only.

### Runbook note for `back-siricmanpropiedades/deploy/README.md` (neutral Spanish)

```markdown
## 7. Panel de administración: sesión de administradores

A partir de la versión del front que incluye el inicio de sesión del panel (`/admin`),
el servicio `web` necesita la variable `API_INTERNAL_URL`. Ya está definida en
`compose.yml` (`http://api:3000`): el front la usa para comunicarse con la API dentro
de la red interna de Docker. No es necesario agregarla al `.env`.

Orden de actualización:

1. Copiar al servidor el `compose.yml` actualizado:
   `scp -P 5941 deploy/compose.yml siricman:~/siricman/`
2. Aplicar los cambios: `docker compose pull && docker compose up -d`.
   Aplicar el `compose.yml` antes de que exista la imagen nueva del front no causa
   problemas: la imagen anterior ignora la variable.
3. Verificar: `docker compose exec web printenv API_INTERNAL_URL` debe mostrar
   `http://api:3000`.

IP real del visitante: la API limita los intentos por IP. Las solicitudes del panel
llegan a la API desde el servidor de Next, por eso el front reenvía la IP real del
visitante en el encabezado `X-Forwarded-For`, tomada del valor que agrega Caddy.
Para que esto siga siendo seguro:

- No publicar puertos de `api` ni de `web`; solo Caddy expone 80/443.
- No configurar `trusted_proxies` en Caddy, salvo que se agregue un CDN o balanceador
  delante. En ese caso, revisar esta sección antes del cambio.
- Mantener `TRUST_PROXY=1` en el `.env` de la API.

Comprobación manual después del deploy (límites independientes por IP):

1. Desde una conexión A (por ejemplo, Wi-Fi), enviar seis intentos de login seguidos
   con un usuario inexistente (por ejemplo, `prueba-a`). El sexto debe mostrar el
   mensaje de demasiados intentos.
2. Inmediatamente, desde una conexión B (por ejemplo, datos móviles), intentar el login
   con otro usuario inexistente (`prueba-b`). Debe mostrar "Usuario o contraseña
   incorrectos", no el mensaje de demasiados intentos.
3. Si la conexión B también queda bloqueada, la IP no se está reenviando: revisar la
   configuración de Caddy y los registros de `web`.
```

## Testing Strategy

Strict TDD: every production file is preceded by a failing test. Front runner: `npm test` (Vitest). Back runner: `npm test` (Jest).

| Layer | What to test | Approach |
|---|---|---|
| Back unit | `toSessionUser` shape; `me` guard metadata (`__guards__` contains `AuthGuard('jwt')` and `UserRoleGuard`), empty `META_ROLES`, delegation, no `logout`/`checkAuthStatus` call; existing scope rejection stays green | Jest; `Reflect.getMetadata`, following the pattern of `admin-properties.controller.spec.ts`; direct controller instantiation with a mocked service |
| Front unit: `client-ip` | Single IP; rightmost of a chain; whitespace; IPv6 and `::ffff:` mapped; invalid, injected, or empty → `undefined` | Node env, pure |
| Front unit: `client` | URL composition (`/api` prefix, trailing slash); missing env → throws; `Authorization` only with a token; XFF forwarded or omitted; `cache: no-store`; 2xx JSON; 401/400/429/500 → `ApiError(status, message)`; network error or timeout → `ApiError(0)`; empty 201 body | `vi.stubGlobal("fetch")`, mocked `next/headers` `headers()` |
| Front unit: `auth` endpoints and guards | Paths, methods, bodies per endpoint; type guards on the three login shapes | Mock `apiFetch` |
| Front unit: `cookies`, `roles` | Options per env (`vi.stubEnv("NODE_ENV", "production"/"development")`): `httpOnly`, `sameSite: lax`, `path: /admin`, `maxAge` 3600/300/900; clearing sets `maxAge: 0` on the same path; `canAccessPanel` truth table | Cookie store fake |
| Front unit: `proxy` | No cookie on `/admin` → login; cookie on `/admin/login` → `/admin`; `reason=expired` or `forbidden` → next + three expiring `set-cookie`; public auth paths pass without a cookie; matcher does not cover `/` | `NextRequest`, response headers |
| Front unit: actions | login: full + admin → cookie + redirect `/admin`; full + `user` → logout called, no session cookie, `no-access`; `mfaRequired`/`mfaSetupRequired` → pending cookie + redirect; 401/400/429/0 → codes; empty fields → `validation` without an API call. verify: missing cookie → redirect login; 401 keeps the cookie. enable/confirm: happy path, QR produced, setup cookie cleared, 401 → expired redirect. logout: API failure still clears and redirects | Mock `@/lib/api/auth`, `next/headers`, `next/navigation` |
| Front unit: `dal` | No cookie → redirect login; 401 → `reason=expired`; disallowed role → logout + `reason=forbidden`; `ApiError(0)` → rethrow (error boundary) | Same mocks |
| Front component | `LoginForm`, `MfaVerifyForm`, `MfaEnrollment`, `BackupCodes`, `SubmitButton`, `FormAlert`, `AdminHeader`, `LogoutButton`: labels, `role="alert"` errors, `aria-invalid`, pending disables submit, notices per `reason`, password field never prefilled, acknowledgement gates the continue link | RTL + user-event, jsdom, `vi.fn` async actions passed as props |
| Front static | Token never in client code: only `server-only` modules touch `SESSION_COOKIE` values; `npm run build` fails if a client component imports them | `server-only` import guard + `npm run build` in verify |
| E2E | N/A: no Playwright/Cypress (out of scope) | Manual post-deploy check (runbook) |

## Threat Matrix

The skill's reference matrix (process, VCS, and PR boundaries) does not apply:

| Boundary | Applicability |
|---|---|
| Documentation-like paths | N/A: no file classification or execution |
| Git repository selection | N/A: no git automation |
| Commit state | N/A: no git automation |
| Push state | N/A: no git automation |
| PR commands | N/A: no PR automation |

Web-security boundaries this design does introduce. Each is a design requirement that must flow into RED tests:

| Threat | Response | RED test |
|---|---|---|
| Spoofed `X-Forwarded-For` from the browser | Caddy discards untrusted values; the BFF takes the rightmost entry, IP-validated; `api`/`web` publish no ports | `client-ip.test.ts` chain/injection cases |
| Bearer token reaching the client | httpOnly cookies; only `server-only` modules read them; actions return no tokens | `cookies.test.ts` options; action tests assert the returned state has no token |
| CSRF on mutations | Server Actions (Origin vs Host/X-Forwarded-Host check; Caddy preserves Host) + `SameSite=Lax`; no auth Route Handlers | N/A for unit (framework behavior); documented |
| `user`-role session persisting | `completeSession` revokes and never sets the cookie; `getCurrentUser` re-gates | action + `dal` tests |
| Open redirect after login | No `returnTo` parameter; fixed `/admin` target | proxy/action tests assert fixed locations |
| Redirect loop on a stale cookie | The proxy skips the `/admin/login → /admin` redirect when `reason` is present and clears the cookies | `proxy.test.ts` |
| Forced logout via a crafted `?reason=expired` link | Accepted (low impact: it only drops the cookie, and the token dies within 60 min) | none |

## Migration / Rollout

- No database migration and no entity changes.
- **Order.** Slice 1 (back) merges and deploys first: new `api` image plus `compose.yml` with `API_INTERNAL_URL`. That line is inert for the current web image. Front slices 2–5 then merge in order (stacked-to-main, each merged before the next). The web image is deployed after slice 5, or after any slice, since `/admin` without screens is harmless. The user runs every server command.
- **Rollback.** Revert a PR and redeploy the previous GHCR tag. Clearing cookies invalidates nothing server-side; if a leak is suspected, rotate `JWT_SECRET`.
- **Post-deploy check.** Two-IP throttle independence (runbook), a full MFA login, and logout.

## Open Questions

- [ ] Caddy's XFF behavior is taken from Caddy docs (`reverse_proxy` defaults, v2.5+), not verified against the deployed `caddy:2-alpine` binary. The runbook's two-IP manual check is the acceptance gate. Non-blocking.
- [ ] Before apply, verify the `qrcode` version and its transitive dependencies (`npm view qrcode dependencies`); fall back to `uqr` if they are unacceptable. Non-blocking.
- [ ] The global throttle of 20 req/min per IP applies to `/auth/me` (one call per admin page render). This is fine for feature 5, but feature 6 pages that also fetch data may approach the limit. Revisit there with `@SkipThrottle` or a separate limit on `/auth/me`. Out of scope now, and the proposal forbids throttle changes.

# Feature 6 — Admin panel: property list and editor

**Objective:** admins and managers can list, filter, create, edit, publish/archive, change the deal status of, delete (admin only) and manage the photos of properties from `/admin`, on a phone first.

**Why:** the back already exposes the full properties + images API (features 3–4) and the session is in place (feature 5); without this UI nobody can load the catalog the public site (feature 7) will show.

## Scope

- In: BFF transport for PATCH/PUT/DELETE + multipart, typed properties/images/neighborhoods client, form primitives (select, textarea, checkbox), mobile-first panel shell with navigation, property list with filters and pagination, create/edit form, lifecycle actions (publish/archive/unpublish, deal status, delete), images manager (upload, reorder, delete, cover = first).
- Out: leads inbox (feature 8), public pages (feature 7), user management, creating neighborhoods from the panel (the 48 CABA barrios are seeded; can be added later), drag-and-drop reordering (buttons are accessible and work on touch).

## Constraints and decisions

- **Design:** no admin mockup is required; the user left the panel design to Claude's judgment with one rule — follow the public site's theme. Reuse the site tokens in `globals.css` (navy/gold/ink, radii, shadows) and the site fonts (Manrope body, Bodoni Moda display headings). The earlier plan to load Figtree for the admin is dropped for visual coherence.
- **Mobile first:** base styles target phones; enhance with `min-width` media queries (tablet 640px, desktop 960px — the site already uses 960px). Lists render as cards on phones and a table from 960px. Touch targets ≥ 44px.
- **Good practices:** container/presentational split (pages fetch and call actions; components render), server actions with `useActionState` returning typed state and `redirect()` outside try/catch (feature 5 convention), accessible forms (labels, `aria-invalid`, `aria-describedby`, `role="alert"`), no JWT in the browser (BFF only).
- UI copy in Spanish; code, identifiers, comments in English. Routes in Spanish: `/admin/propiedades`, `/admin/propiedades/nueva`, `/admin/propiedades/[id]`. `/admin` redirects to `/admin/propiedades`.
- **Product decision (ROADMAP, feature 6):** restrict deal status `sold` to sale and `rented` to rent. Decided: yes, in the panel UI (a sale offers available/reserved/sold; a rent offers available/reserved/rented). Back enforcement is a follow-up (no back change in this feature).
- **Image upload size:** the back accepts up to 15 MB per image. Server actions default to a 1 MB body and the proxy buffers request bodies, so both limits must be raised explicitly (verify the exact Next 16 config keys in the docs before changing `next.config.ts`).
- Delete is admin-only (back returns 403 to managers, and 400 once a property was ever published); the UI hides the delete control for managers and explains the published case.

## TDD

- Mode: **strict TDD enabled** (source: user global orchestrator config "Strict TDD Mode: enabled").
- Runner: Vitest + @testing-library/react + jsdom (`npm test`).

## Delivery

- Forecast: well above 400 authored lines. Strategy `auto-chain` with `stacked-to-main`: one branch + PR per task (or small group), merged to `main` before the next starts (user authorized autonomous merges).

## Tasks

| ID | Task | Route | Status | Commit / PR |
|----|------|-------|--------|-------------|
| T1 | BFF transport (PATCH/PUT/DELETE, multipart) + typed properties/images/neighborhoods API + Spanish labels | delegated (writer trigger: 2+ files) | ✅ | `d9390e4`, `0f47d3f` |
| T2 | Form primitives (SelectField, TextareaField, CheckboxField) + mobile-first panel shell with nav; `/admin` → `/admin/propiedades` | delegated | ✅ | `3c38c7a`, `c38221d` |
| T3 | Property list page: filters (q, status, operation, type), pagination, cards → table | delegated | ⬜ | |
| T4 | Create/edit form with server actions and field error mapping | delegated | ⬜ | |
| T5 | Lifecycle actions: publish/archive/unpublish, deal status (restricted by operation), delete (admin only) | delegated | ⬜ | |
| T6 | Images manager: upload (15 MB limits), reorder, delete, cover badge | delegated | ⬜ | |
| T7 | ROADMAP + docs close-out; manual e2e against the local back | inline | ⬜ | |

## Acceptance criteria

- On a 375px viewport every panel screen is usable without horizontal scroll; from 960px the list is a table.
- A manager can create a draft, edit it, upload/reorder/delete photos, publish, archive, unpublish and change the deal status; only an admin sees delete, and only for never-published properties.
- Back validation errors surface next to the right field or as a form alert, never as a crash.
- `npm test`, `npm run lint` and `npm run build` pass after every task.

## Checks per task

`npm test`, `npm run lint`, `npm run build`.

## Progress / evidence

### T1 — transport + typed API (strict TDD)

- `apiFetch` supports GET/POST/PATCH/PUT/DELETE, empty/204 bodies, `FormData` (no Content-Type, 60 s default timeout); `ApiError.details` keeps Nest's `message[]` for field mapping.
- `src/lib/api/properties.ts` (server-only) wraps every admin property/image endpoint plus `listNeighborhoods`; `src/lib/properties/{enums,labels}.ts` are client-safe (Spanish labels, `allowedDealStatuses`, `formatPrice`).
- Numeric columns arrive as numbers (the back's `numericTransformer` parses them); `neighborhood` includes `createdAt`.
- RED: client 6 failed / 20 passed; labels and properties failed on missing modules. GREEN: 201 tests passed. Lint 0 errors (1 pre-existing warning). Build OK. Parent spot check: `npx vitest run src/lib` → 104 passed.

### T2 — form primitives + panel shell (strict TDD)

- `SelectField`, `TextareaField`, `CheckboxField` match `TextField` (`error`, `hint`, aria wiring, 44 px, gold focus ring).
- `AdminShell` (sticky top bar + drawer on phones, navy sidebar with gold active indicator from 960 px), `AdminNav` driven by `nav-items.ts` (feature 8 appends "Consultas"), `PageHeader` for page titles/actions. `AdminHeader` removed.
- `/admin` redirects to `/admin/propiedades`; `openspec/specs/admin-session/spec.md` landing requirement updated.
- RED: 7 files failed (missing modules; old landing page). GREEN: 226 tests passed. Lint 0 errors. Build OK.

## Next step

T3.

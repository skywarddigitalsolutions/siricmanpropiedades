# Feature 16 — Admin: property list + guided editor

**Objective:** finding and loading properties in the panel feels easy: a visual, searchable list, and a guided flow to create a property with a validated address, a map, photos you can see and reorder, and a preview before publishing.

**Problem / why:** the list has no photos, no sort, and search ignores the address; the editor is one ~25-field form with empty defaults, photos can only be added after the first save on a separate block, the address is free text with no check, there is no preview, admin selects are native and ugly, and publishing is allowed with zero photos or no description.

## Scope

- List: cover thumbnail + "Sin fotos" chip, search by code/title/address, sort (recientes, última edición, precio within a currency), status chips with counts, `hasImages` filter, quick actions ("Ver en el sitio", publish/unpublish), styled admin selects.
- Editor: guided steps — 1 Datos (operation, type, address with CABA validation + map + barrio suggestion, price, rooms, areas, age) → saves a draft; 2 Fotos (grid with previews, cover badge, drag-and-drop reorder on desktop, buttons on touch, client-side compression before upload); 3 Descripción y extras (description, services, conditions, marketing tag, featured; optional blocks collapsed); 4 Vista previa (public detail view rendered in the admin with a "no publicada" banner) → Publicar with a readiness checklist (≥1 photo, description, price). Currency default USD for sale / ARS for rent; suggested title from type + barrio + rooms. The same steps work for editing an existing property (step navigation, not a forced linear flow).
- Out: storing coordinates (no lat/lng in the model, feature 9 decision), multi-currency conversion.

## Constraints and decisions

- Back contracts: `back-siricmanpropiedades/odd/tasks/admin-api-extensions.md` (list fields, `sort`, `counts`, `hasImages`). Create requires the 13 required fields (back DTO), so the draft is created at the end of step 1, then photos and extras are added to it.
- Address validation uses the official CABA normalizer (USIG) `https://servicios.usig.buenosaires.gob.ar/normalizar/?direccion=<q>&geocodificar=true` (keyless, verified working 2026-10-01). Called server-side (route handler / server action) so the admin CSP keeps `connect-src 'self'`. Only CABA results are accepted. Barrio suggestion from coordinates via USIG `datos_utiles` if available (verify; otherwise skip).
- Map: the existing keyless Google Maps iframe embed (`MapEmbed`), allowed by the CSP `frame-src`.
- Mobile-first; admin theme; Spanish UI copy with voseo.

## TDD

- Mode: strict TDD enabled (source: user global orchestrator config). Runner: `npm test` (Vitest). RED observed before GREEN.

## Tasks

| ID | Task | Route | Status | Commit |
|----|------|-------|--------|--------|
| T1 | Admin `SelectField` restyle + property list (thumbnails, search placeholder, sort, status chips with counts, quick actions) | delegated (writer trigger: 2+ files) | ✅ | `e2d9805` |
| T2 | Address autocomplete/validation via USIG (server-side) + map preview + barrio suggestion | delegated | ✅ | `d8cd561` |
| T3 | Guided editor steps (Datos → Fotos → Descripción → Vista previa), defaults, suggested title, readiness checklist | delegated | ✅ | `8a7e239` |
| T4 | Photos step: grid with previews, drag-and-drop + button reorder, client-side compression | delegated | ✅ | `5074ad8` |
| T5 | Preview page (public detail view inside the admin) | delegated | ✅ | `e1b9240` |

## Acceptance criteria

- List shows covers, finds by address, sorts, filters by status with counts.
- A new property can be created end to end: validated CABA address with map → draft → photos visible and reorderable → description → preview → publish (blocked/warned without photos or description).
- `npm run lint`, `npm test`, `npm run build` green.

## Progress

- 2026-10-01: feature started, branch `feat/admin-properties-editor`. RDD: off (default).
- 2026-10-01: T1-T5 done (single front writer, strict TDD: RED observed, then GREEN, per task).
  - T1 RED: list-params (4), PropertyList/Filters/StatusTabs/QuickActions/SelectField and page tests failing (13 tests, 6 files); GREEN: full suite 826 passing after T2.
  - T2 RED: `usig/address`, `usig-client`, `/admin/api/direcciones` route and `AddressField` suites failing to load; GREEN: 23 + 10 tests.
  - T3 RED: steps, readiness, suggest, `only` parsing, actions (6), PropertyForm, Stepper, Checklist, StepNav, AutoHideNotice, StatusPanel suites failing; GREEN: 872 tests.
  - T4 RED: image-compression suite, `reorderByIds`/`validatePickedImage`, manager drag/upload (7 tests); GREEN: 898 tests.
  - T5 RED: preview mapper, PreviewBanner, preview page, PropertyDetailView preview mode (5 files); GREEN: 914 tests.
  - Verification: `npm run lint` 0 errors (1 pre-existing warning in MfaEnrollment), `npm test` 914 passing, `npm run build` green.

## Decisions

- USIG is called server-side only: `GET /admin/api/direcciones?q=` (suggestions) and `?lat&lon` (barrio via `ws.usig.../datos_utiles`), cookie-gated, query limited to 3-120 chars, 4 s timeout; USIG failure answers `unavailable: true` and the editor warns "No pudimos validar la dirección" without blocking the save. Only `cod_partido: "caba"` results of kind `calle_altura` / `calle_y_calle` are accepted; barrio is matched accent-insensitively to the app's list.
- The back has no floor/unit field, so "Piso / Depto" is appended to `address` after a comma ("Boedo 123, 4° B") and split back when editing.
- Steps are `?paso=datos|fotos|descripcion|vista-previa`; each form step sends a partial PATCH (the back's `UpdatePropertyDto` is `PartialType`). Create saves only step-1 fields (the 13 required) and redirects to `?paso=fotos&creada=1`.
- The status panel and delete/deal-status actions moved to step 4 ("Publicación y estado"). Publishing is blocked in the UI (checklist) and re-checked in `changePublicationAction` (reads the property: >=1 photo, description >=50 chars, price > 0), because the back does not enforce it.
- Preview lives outside the `(panel)` shell (`(preview)` route group) so the public detail view keeps its own `<main>`; `PropertyDetailView` got a `preview` prop (no inquiry form, no WhatsApp bar, no outbound links).
- Photos: `@dnd-kit/core|sortable|utilities` added; drag handle plus the existing buttons; per-file compression (2560 px long edge, WebP then JPEG fallback, quality 0.85, skip under 1.5 MB, keep the original when not smaller); originals up to 60 MB may be picked, the 15 MB limit is checked after compression. Uploads run outside a React transition (updates before the first `await` of an async transition are held back).
- List: URL-driven; price sort uses `orden=precio-asc|desc` and is dropped by the parser without a currency (the back would 400); status tab replaces the publication status select (kept as a hidden input).
- Quick action Publicar in the list is disabled with no photos, and the server action enforces the full checklist.

## Not done / follow-ups

- No end-to-end browser check of drag and drop, compression and the USIG calls against a running stack (jsdom has no layout, canvas or `createImageBitmap`); logic is unit-tested through injected dependencies.

## Next step

Push, PR, deploy.

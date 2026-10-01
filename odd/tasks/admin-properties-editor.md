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
| T1 | Admin `SelectField` restyle + property list (thumbnails, search placeholder, sort, status chips with counts, quick actions) | delegated (writer trigger: 2+ files) | ⬜ | |
| T2 | Address autocomplete/validation via USIG (server-side) + map preview + barrio suggestion | delegated | ⬜ | |
| T3 | Guided editor steps (Datos → Fotos → Descripción → Vista previa), defaults, suggested title, readiness checklist | delegated | ⬜ | |
| T4 | Photos step: grid with previews, drag-and-drop + button reorder, client-side compression | delegated | ⬜ | |
| T5 | Preview page (public detail view inside the admin) | delegated | ⬜ | |

## Acceptance criteria

- List shows covers, finds by address, sorts, filters by status with counts.
- A new property can be created end to end: validated CABA address with map → draft → photos visible and reorderable → description → preview → publish (blocked/warned without photos or description).
- `npm run lint`, `npm test`, `npm run build` green.

## Progress

- 2026-10-01: feature started, branch `feat/admin-properties-editor`. RDD: off (default).

## Next step

T1.

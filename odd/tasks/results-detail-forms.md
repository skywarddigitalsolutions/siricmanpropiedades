# Feature 20 — Results, property detail and forms

**Objective:** finish the public UX pass: a results page that feels fast and clear, a property detail that sells the property, and forms that guide the user.

**Problem / why (2026-10-01 audit + owner feedback):** results freeze while loading (no skeleton), filters take a quarter of the phone screen, active filters can't be removed one by one, chips jump to the top, pagination is prev/next only; on the detail page the gallery has no full-screen view, the spec cards float loosely, the description is a wall of text, the title shows in ALL CAPS as typed, the mobile bottom bar has an unlabeled WhatsApp icon and no call button; forms lose focus on error and the success state is a dead end; the mobile menu has no focus trap; some grey text fails contrast.

## Scope

- Results: `loading.tsx` skeleton; active filter chips with ✕ and "Limpiar todo"; filter bar not sticky on mobile (or collapses on scroll), `scroll={false}` on filter links; numbered pagination (current page filled navy circle, same style as the admin); result count and sort aligned.
- Detail: full-screen gallery (lightbox with swipe, keyboard arrows, counter, close; thumbnails strip on desktop); 3:2 / 16:9 aspect; title display normalized (title case if the stored title is all caps — display only, data untouched); spec grid tidy (consistent card sizes, icons); description with "Ver más" after ~6 lines and paragraphs preserved; mobile bottom bar: price + "WhatsApp" (labeled) + "Llamar" (`tel:`); desktop aside with price + contact; "Abrir en Google Maps" link under the map.
- Forms (contact, appraisal, inquiry): focus the first invalid field after a failed submit, field errors announced (`aria-live`/`aria-describedby`), optional fields marked, success state with next steps ("Seguir viendo propiedades", WhatsApp).
- Accessibility: mobile menu focus trap + focus return + body scroll lock (native `<dialog>` like `FiltersSheet`), `aria-current` on nav; `--color-text-faint` contrast ≥ 4.5:1 for text uses; `100dvh` in sheets.
- Out: consortium administration (feature 21).

## TDD

- Mode: strict TDD enabled (source: user global orchestrator config). Runner: `npm test` (Vitest). RED observed before GREEN.

## Tasks

| ID | Task | Route | Status | Commit |
|----|------|-------|--------|--------|
| T1 | Results: skeleton, active filter chips, mobile filter bar, numbered pagination | delegated | ✅ | `9676e1c` |
| T2 | Detail: lightbox gallery, title normalization, specs, description "Ver más", mobile bar, maps link | delegated | ✅ | `cffee71` |
| T3 | Forms + accessibility (focus on error, success next steps, menu dialog, contrast) | delegated | ✅ | `5075638` |

## Acceptance criteria

- Visually checked at 1440px and 390px; `npm run lint`, `npm test`, `npm run build` green.

## Progress

- 2026-10-01: feature started, branch `feat/results-detail-forms`. RDD: off (default).
- 2026-10-01 T1: RED (`activeFilters`/`pageItems` missing, `ResultsPagination`/`ActiveFilters` components missing) then GREEN. Helpers `activeFilters(state, neighborhoods)` in `search-params.ts`, `pageItems` in `pagination.ts`. Filter bar scrolls away on phones and is one sticky row from 1024px. Screenshots: `f20-results-1440.png`, `f20-results-390b.png`, `f20-pagination-390.png`, `f20-skeleton-390.png`.
- 2026-10-01 T2: RED (`displayTitle`, `propertyMapsHref`, lightbox, `ExpandableText`, bar and maps link missing) then GREEN. Lightbox is a native `<dialog>` (`PropertyLightbox`), title case chosen over sentence case so barrio and street names keep their capitals. Screenshots: `f20-detail-1440.png`, `f20-detail-390.png`, `f20-lightbox-1440.png`, `f20-lightbox-390.png`, `f20-specs-1440.png`, `f20-specs-390.png`.
- 2026-10-01 T3: RED (19 failing new/updated assertions: focus on first invalid field, hints, optional marks, success actions, Header dialog/aria-current) then GREEN. Shared pieces in `src/components/site/forms/`. Screenshots: `f20-form-error-390.png`, `f20-inquiry-error-1440.png`, `f20-menu-390.png`. The success state was covered by tests only (submitting for real would create a lead in the dev database).
- Verification: `npm run lint` 0 errors (1 pre-existing warning in `MfaEnrollment`), `npm test` 140 files / 1004 tests, `npm run build` OK.

## Next step

Push, PR, deploy.

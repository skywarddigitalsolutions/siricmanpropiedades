# Feature 20 — Results, property detail and forms

**Objective:** finish the public UX pass: a results page that feels fast and clear, a property detail that sells the property, and forms that guide the user.

**Problem / why (2026-10-01 audit + owner feedback):** results freeze while loading (no skeleton), filters take a quarter of the phone screen, active filters can't be removed one by one, chips jump to the top, pagination is prev/next only; on the detail page the gallery has no full-screen view, the spec cards float loosely, the description is a wall of text, the title shows in ALL CAPS as typed, the mobile bottom bar has an unlabeled WhatsApp icon and no call button; forms lose focus on error and the success state is a dead end; the mobile menu has no focus trap; some grey text fails contrast.

## Scope

- Results: `loading.tsx` skeleton; active filter chips with ✕ and "Limpiar todo"; filter bar not sticky on mobile (or collapses on scroll), `scroll={false}` on filter links; numbered pagination (current page filled navy circle, same style as the admin); result count and sort aligned.
- Detail: full-screen gallery (lightbox with swipe, keyboard arrows, counter, close; thumbnails strip on desktop); 3:2 / 16:9 aspect; title display normalized (sentence/title case if the stored title is all caps — display only, data untouched); spec grid tidy (consistent card sizes, icons); description with "Ver más" after ~6 lines and paragraphs preserved; mobile bottom bar: price + "WhatsApp" (labeled) + "Llamar" (`tel:`); desktop aside with price + contact; "Abrir en Google Maps" link under the map.
- Forms (contact, appraisal, inquiry): focus the first invalid field after a failed submit, field errors announced (`aria-live`/`aria-describedby`), optional fields marked, success state with next steps ("Seguir viendo propiedades", WhatsApp).
- Accessibility: mobile menu focus trap + focus return + body scroll lock (native `<dialog>` like `FiltersSheet`), `aria-current` on nav; `--color-text-faint` contrast ≥ 4.5:1 for text uses; `100dvh` in sheets.
- Out: consortium administration (feature 21).

## TDD

- Mode: strict TDD enabled (source: user global orchestrator config). Runner: `npm test` (Vitest). RED observed before GREEN.

## Tasks

| ID | Task | Route | Status | Commit |
|----|------|-------|--------|--------|
| T1 | Results: skeleton, active filter chips, mobile filter bar, numbered pagination | delegated | ⬜ | |
| T2 | Detail: lightbox gallery, title normalization, specs, description "Ver más", mobile bar, maps link | delegated | ⬜ | |
| T3 | Forms + accessibility (focus on error, success next steps, menu dialog, contrast) | delegated | ⬜ | |

## Acceptance criteria

- Visually checked at 1440px and 390px; `npm run lint`, `npm test`, `npm run build` green.

## Progress

- 2026-10-01: feature started, branch `feat/results-detail-forms`. RDD: off (default).

## Next step

T1.

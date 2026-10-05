# Feature 24 — Mobile results UX, richer content pages, credits

**Objective:** close the owner's 2026-10-05 review: a cleaner mobile results bar with a multi-barrio filter, wrapped type chips, an aligned appraisal form, richer Consorcios and Nosotros pages, and the developer credit in the footer.

**Problem / why (owner screenshots):**
- Mobile results bar: the Todas/Comprar/Alquilar segmented control takes the space of the barrio search ("Ingresá un bar…" truncated); the operation was already chosen before, so it belongs in the filters sheet.
- Filters sheet: no barrio filter; the owner wants to select several barrios.
- Type chips (Departamento, Casa, PH…) scroll horizontally — on mobile AND desktop (explicit).
- "Pedí tu tasación" (mobile): "Ambientes (opcional)" and "Superficie aprox. (m²) (opcional)" inputs are misaligned because the second label wraps.
- Footer "© 2026 Siricman Propiedades": the site was built by Skyward Digital Solutions.
- `/administracion-de-consorcios`: too many cards; "Cómo trabajamos" should read as a step-by-step line; "Por qué elegirnos" friendlier; overall too basic.
- `/nosotros`: too basic; the team section looks bad.

## Scope and rules

- **Mobile-only** (must not change desktop ≥1024px unless stated): results bar without the operation control (operation moves into the filters sheet), barrio search full width, barrio multi-select section in the filters sheet, appraisal form alignment.
- **All widths (explicit):** type chips wrap instead of scrolling (home and results), footer credit, Consorcios and Nosotros redesign.
- Multi-barrio: URL `barrio=palermo,belgrano` (comma-separated slugs, max 10); API `neighborhood=palermo,belgrano` (back `feat/multi-neighborhood-filter`). Desktop keeps the single barrio combobox; when several barrios are selected, desktop shows them as active filter chips.
- Footer: keep the copyright with the site owner and credit the developer: "© 2026 Siricman Propiedades · Sitio desarrollado por Skyward Digital Solutions".

## TDD

- Mode: strict TDD enabled (source: user global orchestrator config). Runner: `npm test` (Vitest). RED observed before GREEN; layouts verified with screenshots at 390px and 1440px.

## Tasks

| ID | Task | Route | Status | Commit |
|----|------|-------|--------|--------|
| T1 | Mobile results bar + operation and multi-barrio in the filters sheet (URL/API multi-barrio) | delegated | ⬜ | |
| T2 | Type chips wrap (home + results); appraisal form alignment (mobile); footer credit | delegated | ⬜ | |
| T3 | Consorcios page redesign (step line, friendlier why-us, richer sections) | delegated | ⬜ | |
| T4 | Nosotros page redesign (team section) | delegated | ⬜ | |

## Acceptance criteria

- Desktop results/home unchanged except chips wrapping; mobile bar shows barrio search full width + Filtros; sheet has operation and multi-barrio.
- Screenshots reviewed at 390px and 1440px; `npm run lint`, `npm test`, `npm run build` green.

## Progress

- 2026-10-05: branch `feat/mobile-ux-content`. Demo properties seeded in the LOCAL dev DB (SP-102..SP-109) for visual checks. RDD: off (default).

## Next step

T1.

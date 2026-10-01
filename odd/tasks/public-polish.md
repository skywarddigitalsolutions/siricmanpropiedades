# Feature 17 — Public site polish

**Objective:** fix the visual issues the owner reported on the live public site after features 13–14.

**Problem / why (owner feedback 2026-10-01, with screenshots):**
- "Solicitar tasación" CTA band (home, navy band "¿Querés vender o alquilar?") looks bad: flat gold pill floating on the right, a thin decorative circle line, unbalanced.
- The floating WhatsApp pill ("Escribinos") overlaps the footer legal links ("Privacidad") at the bottom right.
- Footer is badly distributed: logo alone on the left, address/hours/contacts in a middle column, "Gabriel Siricman · Martillero…" floating top right, lots of empty space; contacts have no icons.
- Hero search: the "Ambientes" pills (Indistinto, 1–5+) should go back to a dropdown; the "Buscar" button became huge (tall gold block); the "Barrios populares" dropdown renders UNDER the type chips section below the hero (stacking/z-index bug).
- Currency: prices must show a clear symbol everywhere (site and admin): `US$` for dollars and `$` for pesos (today `USD 87.000`).

## Scope

- In: CTA band redesign; footer redesign (columns, icons, legal row) + WhatsApp button never covering footer content; hero search fixes (ambientes `Select`, compact Buscar, dropdown above following sections); shared `formatPrice` → `US$ 87.000` / `$ 850.000` and price inputs/filters showing the right symbol; icons only where they help (lucide-react, already in the project).
- Out: favorites (feature 19), results/detail redesign (feature 20).

## TDD

- Mode: strict TDD enabled (source: user global orchestrator config). Runner: `npm test` (Vitest). RED observed before GREEN for behaviour (formatter, components); CSS verified by build + screenshots.

## Tasks

| ID | Task | Route | Status | Commit |
|----|------|-------|--------|--------|
| T1 | Currency symbols site-wide (`formatPrice`, price inputs, filters, admin) | delegated | ⬜ | |
| T2 | Hero search fixes: ambientes dropdown, compact Buscar, combobox stacking | delegated | ⬜ | |
| T3 | CTA band + footer redesign with icons; WhatsApp button never overlaps the footer | delegated | ⬜ | |

## Acceptance criteria

- Every price reads `US$ …` or `$ …`; tests updated.
- Hero: Ambientes is a dropdown; Buscar has normal button height; the barrio list is above the chips.
- CTA and footer look balanced on 375px and 1440px; WhatsApp never hides footer links.
- `npm run lint`, `npm test`, `npm run build` green.

## Progress

- 2026-10-01: feature started, branch `feat/public-polish`. RDD: off (default).

## Next step

T1.

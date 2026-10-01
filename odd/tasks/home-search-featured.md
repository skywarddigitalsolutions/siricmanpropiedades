# Feature 14 — Home: location typeahead, hero photo, featured sale/rent

**Objective:** a home page that feels like a modern property portal: type the barrio instead of scrolling a 48-item list, a real photo in the hero, and featured properties split by Comprar / Alquilar.

**Problem / why:** the hero search is three native selects in form-looking boxes (barrio has 48 options and no search); the hero is a navy striped gradient although the owner supplied a photo (`public/hero.jpeg`, portrait 958x1280); the "Atención personal" block (GS monogram + quote) does not convince the owner, who wants featured properties separated by operation, like competitor sites but more modern.

## Scope

- In: accessible location combobox (barrio typeahead, accent-insensitive, keyboard + mobile) in the hero, reused in the results barrio filter; tipo and ambientes restyled (chips/segmented or the shared `Select`); hero background photo with overlay; replace "Atención personal" with "Destacadas en venta" and "Destacadas en alquiler" sections (carousel on mobile, grid on desktop, "Ver todas" links), falling back to the latest published when there are no featured ones; carousel arrows on desktop; unify operation wording.
- Out: results page redesign (feature 19), favorites (feature 17).

## Constraints and decisions

- Barrios are already loaded server-side (`getPublicNeighborhoods()`), passed as a prop: no new API call per keystroke. The form keeps working as a plain GET form (hidden `barrio` slug input).
- Hero photo is portrait: use `next/image` with `fill`, `priority`, `sizes="100vw"`, a deliberate `object-position`, and a dark overlay so the white title keeps AA contrast. On wide screens the photo may look soft (958px source); accepted until the owner supplies a landscape version.
- User decision (2026-10-01): remove the "Atención personal" section.

## TDD

- Mode: strict TDD enabled (source: user global orchestrator config). Runner: `npm test` (Vitest). RED observed before GREEN.

## Tasks

| ID | Task | Route | Status | Commit |
|----|------|-------|--------|--------|
| T1 | `LocationCombobox` (matching helper + accessible component) in hero and results barrio filter | delegated (writer trigger: 2+ files) | ✅ | 00136f7 |
| T2 | Hero redesign: photo + overlay, search panel restyle (tipo/ambientes), operation wording | delegated | ✅ | 07fa5be |
| T3 | Featured sale/rent sections replacing "Atención personal", carousel arrows | delegated | ✅ | 2cc9be7 |

## Acceptance criteria

- Typing "nunez", "Nuñez" or "núñ" suggests Núñez; arrows/Enter/Escape work; the GET submits the slug; works on a phone.
- Hero shows the photo with readable text on mobile and desktop.
- Home shows two featured blocks by operation, each with "Ver todas" to the filtered results.
- `npm run lint`, `npm test`, `npm run build` green.

## Progress

- 2026-10-01: feature started, branch `feat/home-search-featured`. RDD: off (default).
- 2026-10-01 T1: RED (helper + combobox tests failing on missing modules; results/home tests failing on the old select), GREEN after `matchNeighborhoods`, `LocationCombobox` and wiring into hero and results bar; "Venta/Alquiler" unified to "Comprar/Alquilar" in the results bar (URL params unchanged); `AutoSubmitSelect` removed (unused).
- 2026-10-01 T2: RED (hero photo and rooms pills tests), GREEN after the hero rewrite (next/image fill + overlay, one white card with Ubicación/Tipo/Ambientes pills, segmented operation control, code search kept as a link-style details). `public/hero.jpeg` committed.
- 2026-10-01 T3: RED (featured helper, section and home tests), GREEN after `pickShowcase`, `FeaturedSection`/`FeaturedTrack` (snap carousel, desktop arrows disabled at the ends), "Atención personal" removed, TypeChips focus-visible + edge fade. Photo-count badge skipped: the public list item has no image count.
- Verification: lint 0 errors (1 pre-existing warning), 716 tests pass, build OK.

## Next step

Push, PR, deploy.

# Feature 19 — Public favorites

**Objective:** visitors can save properties they like and come back to them, without creating an account.

**Problem / why:** owner request (2026-10-01). Asking a visitor to register to save a property is friction; favorites stored in the browser cover the need.

## Scope

- Heart toggle on property cards and on the property detail; "Favoritos" in the header (with count badge) and the mobile menu; `/favoritos` page.
- Storage in `localStorage` (ids/slugs + a small snapshot: title, price, currency, operation, cover, barrio, savedAt), synced across tabs (`storage` event), capped (e.g. 50).
- The favorites page refreshes each saved property from the public API through the server (same-origin route handler; the site CSP keeps `connect-src 'self'`):
  - still published and available → normal card;
  - sold / rented → card with "Vendida" / "Alquilada" badge, muted, "Ver similares" (same barrio + type + operation) and "Quitar";
  - no longer public (archived/deleted → 404) → "Esta propiedad ya no está disponible" with "Quitar";
  - price changed vs the snapshot → small "Bajó de precio" / "Cambió el precio" note.
- Empty state with a call to action.
- Out: accounts, cross-device sync, email alerts.

## Constraints and decisions

- User decision (2026-10-01): favorites without accounts; behaviour for sold/archived as above.
- No personal data is stored; nothing leaves the browser except the slugs sent to our own route handler.
- Mobile-first; site tokens; Spanish copy with voseo; accessible toggle (`aria-pressed`, label "Guardar en favoritos" / "Quitar de favoritos").

## TDD

- Mode: strict TDD enabled (source: user global orchestrator config). Runner: `npm test` (Vitest). RED observed before GREEN.

## Tasks

| ID | Task | Route | Status | Commit |
|----|------|-------|--------|--------|
| T1 | Favorites store (localStorage, cross-tab sync, cap, SSR-safe hook) + heart toggle on cards/detail + header link with count | delegated | ✅ | 1116bdf |
| T2 | Refresh route handler + `/favoritos` page with sold/unavailable/price-change states | delegated | ✅ | c2b3c33 |

## Acceptance criteria

- Toggling a heart persists across reloads and tabs; the header count updates.
- `/favoritos` shows each state correctly; removing works.
- `npm run lint`, `npm test`, `npm run build` green.

## Progress

- 2026-10-01: feature started, branch `feat/favorites`. RDD: off (default).
- 2026-10-01 T1 (1116bdf): RED = store/toggle/header/card/detail tests failing (missing modules); GREEN = store, useFavorites (useSyncExternalStore), FavoriteToggle, card heart, detail Guardar, header link + badge (after mount). Screenshots fav-home-desktop.png, fav-home-saved-desktop.png, fav-detail-mobile.png.
- 2026-10-01 T2 (c2b3c33): RED = view/route/list/page tests failing (missing modules); GREEN = /api/favoritos route (max 50, regex, dedupe, concurrency 4, ok/gone/error), FavoritesList + FavoriteCard, /favoritos noindex page. Screenshots fav-page-desktop.png, fav-page-sold-mobile.png (sold mocked via route), fav-empty-mobile.png. Decisions: cap evicts oldest; transient API failures map to status error (snapshot shown, never gone); similares links to results URL. Checks: lint 0 errors, npm test 962 passed, build ok.

## Next step

Push, PR, deploy.

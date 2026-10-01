# Feature 7 — Public site: home, results, property detail (SEO)

**Objective:** visitors can find properties from the home, browse and filter results, and open a property page that search engines index well — on a phone first.

**Why:** the catalog (features 3–4) and the admin panel (feature 6) exist, but nothing is public yet; this is the site's reason to exist.

## Scope

- In: public catalog client, home (hero search, type chips, featured carousel, services, personal quote, appraisal CTA), results (`/propiedades`: operation, barrio, quick chips, filters sheet, sort, pagination, empty state), detail (`/propiedades/[slug]`: gallery, price, facts, conditions, description, services, location text, WhatsApp inquiry, mobile bottom bar, unavailable notice), SEO (metadata, canonical, Open Graph, JSON-LD, sitemap, robots).
- Back (small, same feature): `featured` and `code` filters, unavailable properties last, dedicated throttle for public reads.
- Out: inquiry form and leads (feature 8 — the detail offers WhatsApp with a prefilled message meanwhile), map (feature 9 decides the provider; location is shown as text), institutional pages (feature 9), type-chip counts (would need a facets endpoint), video (no field in the API).

## Constraints and decisions

- **Design:** `design/sitio-web-v2.dc.html` (home, RESULTADOS, FICHA blocks) — follow layout, copy and tokens; adapt to real data and accessible semantics (links for navigation, forms for search, `<dialog>` for the filters sheet).
- **Mobile first** (user rule): base styles for phones, `min-width` queries (640 / 960). Touch targets ≥ 44 px.
- **Throttler vs SSR (ROADMAP decision):** pages render on the server per request (`force-dynamic`, so the Docker build never needs the API) and fetch the catalog with Next's data cache (`revalidate: 60`). Those fetches come from the Next container's IP without a visitor IP, so the back gives public catalog reads a dedicated limit of 300 req/min per IP instead of the global 20. A 429 renders a friendly retry message, not a crash. Alternative kept for later: an internal token that lets the Next server skip throttling.
- **Featured filter (ROADMAP decision):** yes — `featured=true` on `GET /api/properties` feeds the home's "Destacadas".
- **Code lookup:** `code` filter (exact, case-insensitive) on `GET /api/properties`; the hero's "¿Tenés un código?" searches it and a single match redirects to its page.
- **Unavailable last:** sold/rented stay listed (social proof, per design) after available/reserved. The back orders by `dealStatus` first: the Postgres enum's declaration order (`available, reserved, sold, rented`) is exactly the desired order.
- **Price sort:** the back sorts by price only within one currency. Picking a price sort without a currency selects the usual one for the operation (venta → USD, alquiler → ARS, all → USD), visible as an active filter.
- **Images:** `next/image` with `unoptimized` — the back already serves WebP renditions (large/thumb); avoiding Next's image cache saves disk on the 30 GB VPS.
- **URLs (Spanish, shareable):** `/propiedades?operacion=venta|alquiler&tipo=&barrio=<slug>&ambientes=&dormitorios=&banos=&cochera=1&credito=1&mascotas=1&moneda=USD|ARS&desde=&hasta=&orden=recientes|menor-precio|mayor-precio&pagina=&codigo=`. Detail: `/propiedades/<slug>`.
- **SEO:** `SITE_URL` runtime env (falls back to `http://localhost:3000`) for `metadataBase`, canonical and sitemap; per-property title/description/OG image; JSON-LD `RealEstateListing` with an `Offer`; `robots.txt` disallows `/admin`.
- UI copy in Spanish (voseo, as in the design); code and comments in English.

## TDD

- Mode: **strict TDD enabled** (source: user global orchestrator config). Front runner: Vitest + RTL (`npm test`). Back runner: Jest (`npm test`).

## Delivery

- Forecast well above 400 authored lines. Strategy `auto-chain`, `stacked-to-main`: one PR per task, merged before the next (autonomous delivery authorized).
- Subagents are rate-limited until 2026-10-03, so tasks run inline (route: inline, trigger evidence recorded per task).

## Tasks

| ID | Task | Repo | Route | Status | Commit / PR |
|----|------|------|-------|--------|-------------|
| B1 | Public catalog: `featured` + `code` filters, unavailable last, public read throttle (catalog + neighborhoods GET) | back | inline (subagents rate-limited) | ✅ | back #21 |
| T1 | Public catalog client (cached, server-only), results URL params, card view-model (price label, specs) | front | inline | ✅ | `9ab11f6` |
| T2 | `PropertyCard` + home page | front | inline | ✅ | `a6fccda` |
| T3 | Results page: filter bar, filters sheet, quick chips, sort, grid, pagination, empty state | front | inline | ✅ | `a22e0ef` |
| T4 | Property detail page: gallery, facts, chips, description, services, location, WhatsApp, bottom bar | front | inline | ✅ | `4b7e254` |
| T5 | SEO: `SITE_URL`/metadataBase, per-page metadata, JSON-LD, sitemap, robots; deploy env docs | both | inline | ✅ | `de59d68`, back #22 |
| T6 | Browser walkthrough (375 / 1280), ROADMAP close-out | front | inline | ✅ | `9fb5fb2`, back #23 |

## Acceptance criteria

- At 375 px every public page works without horizontal scroll; results are a single column on phones and a grid on wider screens.
- From the home a visitor can search by operation/barrio/type/rooms or by code and land on matching results; results filters and sort are reflected in the URL.
- A property page shows all public data, never the exact address when hidden, offers WhatsApp with a prefilled message and has unique title, description, canonical, OG image and JSON-LD.
- `npm test`, `npm run lint`, `npm run build` pass (front); `npm test`, `npm run lint`, `npm run build` pass (back).

## Progress / evidence

### B1 — back public catalog (strict TDD, Jest)

- `featured` and `code` (trimmed, uppercased, `UPPER(code) =`) filters; every public sort starts with `dealStatus ASC` (enum order puts sold/rented last); `PUBLIC_READ_THROTTLE` (300/min) on `PublicPropertiesController` and `GET /neighborhoods`. Spec `property-public-catalog` updated.
- RED: builder spec failed to compile (unknown DTO fields); throttle specs 2 failing. Feature 3's test asserting `featured` was rejected and the service's order assertion were updated to the new contract. GREEN: 39/39 suites. Lint clean. Build OK. Merged as back PR #21.

### T1 — public catalog client + URL state + view model (strict TDD)

- `apiFetch` gained `revalidate` (Next data cache, no visitor IP). `src/lib/api/public-catalog.ts`: `listPublicProperties`, `getPublicProperty`, `getPublicNeighborhoods` (60 s / 1 h). Shared `buildQuery` moved to `query-string.ts`.
- Client-safe `src/lib/public/types.ts`, `search-params.ts` (Spanish URL ⇄ state ⇄ API filters, effective currency for price sort/range, stable hrefs, active filter count, results title), `property-view.ts` (price `/mes`, expenses, specs with a11y labels, tag, status notice, location privacy, facts, conditions, services, WhatsApp inquiry). Fixture `src/test/fixtures/public-property.ts`.
- RED: client (revalidate), public client, search params, view model (missing modules). GREEN: 423 tests passed. Lint 0 errors (1 pre-existing warning). Build OK.

### T2 — card + home (strict TDD)

- `PropertyCard`: stretched title link (one tap target, one name), cover via `next/image` `unoptimized` or "Sin fotos", operation/tag badges, status band (reserved gold, sold/rented navy + dimmed photo), price + code, expenses, type · barrio, specs with sr-only labels. `PropertyIcon` maps semantic icons to lucide. Global `.sr-only` utility.
- Home (`force-dynamic`): `HeroSearch` (GET form to `/propiedades`, operation radios as pills, barrio/tipo/ambientes selects, code lookup in a `<details>`), type chips, carousel "Destacadas" (falls back to "Recién publicadas"), services, personal quote (monogram instead of the missing portrait), appraisal CTA. API failures degrade to the static sections.
- RED: card (missing module), home (5 failing on the placeholder). GREEN: 431 tests. Lint 0 errors. Build OK.

### T3 — results (strict TDD)

- `/propiedades` (`force-dynamic`): redirects non-canonical queries (empty GET fields, invalid/default values) to `canonicalHref`; a code lookup with one match redirects to the property; count heading; sort (auto-submit, `<noscript>` fallback); 12-card grid (1 column on phones); crawlable prev/next pagination; empty, code-not-found and unavailable (429/network) messages with WhatsApp; metadata with canonical and `noindex,follow` for narrow combinations (`resultsSeo`).
- `ResultsFilterBar` (sticky under the header via `--site-header-height`): operation links with `aria-current`, barrio GET form, quick chip links. `FiltersSheet`: modal `<dialog>` (bottom sheet / side panel ≥960 px) with a GET form — type, currency + range, rooms, bedrooms, bathrooms, switches; hidden inputs keep the rest (`PreservedParams`).
- Bug caught by tests: `buildSearchHref` resets the page, so page 2 looked non-canonical → `canonicalHref(state)` keeps the page.
- RED: helpers (missing functions), filter components, page (missing modules), canonical page. GREEN: 451 tests. Lint 0 errors. Build OK.

### T4 — property page (strict TDD)

- `/propiedades/[slug]` (`force-dynamic`, React `cache()` shares one fetch between `generateMetadata` and the page): `notFound()` on 404 → friendly `not-found.tsx`; `(site)/error.tsx` boundary with retry.
- `PropertyDetailView`: back link to the same operation's results, code chip, `PropertyGallery` (scroll snap, counter synced on scroll, prev/next buttons, first photo `priority`, alt "title, foto n de N"), status note (reserved/closed copy), price + expenses + h1 + location (exact only when public), facts list, conditions, description paragraphs, services, location card (map deferred to feature 9), sticky inquiry aside with WhatsApp (prefilled message), fixed bottom bar on phones (hidden ≥960 px).
- Floating WhatsApp button hides on property pages (client `usePathname`), icon extracted to `WhatsAppIcon`.
- Metadata: "title · price", 160-char summary, canonical, Open Graph image (first photo).
- RED: WhatsApp button (1 failing), gallery, page, boundaries (missing modules). GREEN: 466 tests. Lint 0 errors. Build OK.

### T5 — SEO (strict TDD)

- `getSiteUrl()`/`absoluteUrl()` (runtime `SITE_URL`, fallback localhost); root `generateMetadata()` → `rootMetadata()`: `metadataBase`, title template `%s | Siricman Propiedades`, es_AR Open Graph defaults.
- JSON-LD (`serializeJsonLd` escapes `<`): `RealEstateListing` + `Offer` (Sell/LeaseOut, InStock/SoldOut, street address only when public) on property pages; `RealEstateAgent` on the home.
- `robots.ts` (disallow `/admin`, sitemap link) and `sitemap.ts` (landings + every published property, paged by 50, landings only if the API fails), both `force-dynamic`.
- Deploy (back #22): `SITE_URL: https://${SITE_DOMAIN}` on `web`; README section 8 (rollout order, checks, throttle rationale). Front README documents `SITE_URL`.
- Gotcha: the shell layer used here collapses doubled backslashes in commands, so strings with escapes were written via `chr(92)` or the Write tool.
- RED: helpers (missing modules), SEO routes (missing modules), JSON-LD on pages (2 failing). GREEN: 479 tests. Lint 0 errors. Build OK.

### T6 — browser walkthrough + close-out

- Production build (`next start`) against an in-memory mock of the public API (job tmp dir, not in the repo), at 375 px and 1280 px: home (hero search, chips, featured carousel, sections), hero search → `/propiedades?operacion=venta` (empty fields dropped by the canonical redirect), filters sheet (type + max price) → `operacion=venta&tipo=casa&hasta=120000`, sort → `orden=mayor-precio`, card → property page (title "… · USD 117.000 | Siricman Propiedades", canonical with `SITE_URL`, OG image, `RealEstateListing` JSON-LD, no floating WhatsApp), no horizontal scroll anywhere.
- Found and fixed:
  - **Back (#23):** ordering by the `dealStatus` enum split reserved below every available property, breaking price sorts. Now ordered by a stored generated column `is_unavailable` (migration `AddPropertyIsUnavailable1790600000000`; SQL dry-run on the dev Postgres inside a rolled-back transaction). Verified: reserved properties interleave by price, sold last.
  - **Front (`9fb5fb2`):** the fixed bottom bar covered the end of the footer → `body:has(.bottomBar)` reserves its height on phones; the results bar's barrio placeholder clipped at 375 px → "Barrio".
- Expected console 404s: nav prefetches `/tasaciones`, `/nosotros`, `/contacto` (feature 9).
- Checks: front `npm test` 479 passed, lint 0 errors, build OK; back 405 passed, lint/build OK.

## Follow-ups

- Feature 8: inquiry form on the property page (the aside already has `id="consulta"`), "Contanos qué buscás" lead capture from the empty state.
- Feature 9: institutional pages and the map in the property page's "Ubicación" card.
- Real photos for the home hero and Gabriel's portrait (placeholders: navy pattern, "GS" monogram).
- Type-chip counts on the home need a facets endpoint.
- Real e2e against the back with seeded data, and deploy (back first: migration + filters; then front; `compose.yml` with `SITE_URL`).

## Next step

Feature 7 done. Next: feature 8 (leads).

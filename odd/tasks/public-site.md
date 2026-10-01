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
| T2 | `PropertyCard` + home page | front | inline | ⬜ | |
| T3 | Results page: filter bar, filters sheet, quick chips, sort, grid, pagination, empty state | front | inline | ⬜ | |
| T4 | Property detail page: gallery, facts, chips, description, services, location, WhatsApp, bottom bar | front | inline | ⬜ | |
| T5 | SEO: `SITE_URL`/metadataBase, per-page metadata, JSON-LD, sitemap, robots; deploy env docs | both | inline | ⬜ | |
| T6 | Browser walkthrough (375 / 1280), ROADMAP close-out | front | inline | ⬜ | |

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

## Next step

T2.

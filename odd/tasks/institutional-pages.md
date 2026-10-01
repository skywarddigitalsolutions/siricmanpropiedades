# Institutional pages (Tasaciones, Nosotros, Contacto) + map

**Objective:** implement the three institutional routes already linked from the header (`/tasaciones`, `/nosotros`, `/contacto`) and real maps for the office (Contacto) and the property detail "Ubicación" section.

**Why:** the header and home CTA link to routes that 404 today; appraisal and contact leads are the main conversion paths besides property inquiries. The back already accepts them (`LeadType` `appraisal` / `contact`, `LeadTopic` `buy|rent|sell|consortium|other`, `AppraisalDetailsDto`), so this feature is front only.

## Decisions

- **Map provider (user, 2026-10-01): Google Maps keyless iframe embed.** Properties have no lat/lng, only `address`, `showExactAddress` and a neighborhood. Exact → query `"<address>, <barrio>, CABA"`; approximate → query `"<barrio>, CABA"` with a "Zona aproximada" chip. No dependency, no API key, no back migration. Accepted tradeoffs: third-party cookies, no drawn approximate circle. Lazy-loaded iframe with a `title`.
- **Contact email:** keep `info@siricmanpropiedades.com.ar` (`CONTACT_EMAIL`, user decision in feature 8.1) even though the design mock shows `consultas@`.
- **Team placeholders:** the design has two `[Nombre]` members; only Gabriel Siricman is rendered until real names/photos exist (no placeholder copy in production).
- **Delivery:** strategy `stacked-to-main`, one PR per task merged before the next (autonomous delivery authorized). Forecast ~1,200 authored lines total.

## Scope

- Centralize office data in `src/lib/contact.ts` (address, barrio, hours, display phone, Instagram) and reuse it in the footer.
- `MapEmbed` component (Google Maps embed URL builder + lazy iframe).
- `/contacto`: contact tiles (WhatsApp, email, Instagram, hours), contact form (name, "Teléfono o email", topic select, message, honeypot) as a server action posting a `contact` lead, office map.
- `/tasaciones`: 3 steps, appraisal form (Vender/Alquilar, property type, address, rooms, area, name, phone, comments, honeypot) posting an `appraisal` lead with `details`.
- `/nosotros`: intro, logo tile, misión/visión, 7 values, team (Gabriel only).
- Property detail "Ubicación": `MapEmbed` exact vs approximate.
- Metadata + canonical per page; sitemap entries; `seo-routes.test.ts` updated.
- Out: back changes, lat/lng, the sold/rented back enforcement follow-up.

## TDD

Strict TDD on (global config). Runner: `npm test` (Vitest + Testing Library). RED observed before each implementation.

## Checks

`npm test`, `npm run lint` (1 pre-existing warning in MfaEnrollment), `npm run build`. RDD: off (default) → ordinary checks.

## Tasks

- [ ] T1 Contact data + `MapEmbed` + `/contacto` page with contact form + sitemap entry. Route: delegated writer (4+ files).
- [ ] T2 `/tasaciones` page with appraisal form + sitemap entry. Route: delegated writer.
- [ ] T3 `/nosotros` page + sitemap entry. Route: delegated writer.
- [ ] T4 Property detail "Ubicación" uses `MapEmbed`. Route: delegated writer.
- [ ] T5 Docs: ROADMAP (feature 9 done, map decision checked). Route: inline.

## Progress

(none yet)

## Next step

T1.

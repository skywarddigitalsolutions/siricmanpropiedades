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

- [x] T1 Contact data + `MapEmbed` + `/contacto` page with contact form + sitemap entry. Route: delegated writer (4+ files).
- [x] T2 `/tasaciones` page with appraisal form + sitemap entry. Route: delegated writer.
- [ ] T3 `/nosotros` page + sitemap entry. Route: delegated writer.
- [ ] T4 Property detail "Ubicación" uses `MapEmbed`. Route: delegated writer.
- [ ] T5 Docs: ROADMAP (feature 9 done, map decision checked). Route: inline.

## Progress

- T1 done on `feat/contact-page` (`5f4f2f0`, `9fcf863`, `fef3300`). Office data constants in `src/lib/contact.ts` (footer reuses them); `buildMapEmbedUrl` in `src/lib/maps.ts` (z=16 exact / z=14 approximate) + `MapEmbed`; `/contacto` with `ContactForm` + `sendContactAction` (`contact` lead, single "Teléfono o email" field split by `@`, topic required, message optional). RED observed per behavior (missing modules / undefined constants / sitemap length). `npm test` 87 files / 571 tests (parent spot check re-ran: same), lint 0 errors (1 pre-existing warning), build green (`/contacto` static). ~1,180 lines incl. ~450 tests/CSS: exceeds the 400 heuristic because the form, map and page form one reviewable behavior.

- T1 merged: PR #33 (`15cd8aa`).
- T2 done on `feat/appraisal-page` (`24b5243`, `cfd3fe3`, `8d3dc45`). `appraisal-form.ts` (delegates name/phone/message to `parseInquiryForm`, maps `details.*` errors), `sendAppraisalAction` (`appraisal` lead, topic sell/rent, integer rooms/area), `AppraisalForm` (radio-group Vender/Alquilar, 7 property types via `PROPERTY_TYPE_LABELS`), `/tasaciones` page, sitemap (monthly, 0.7). Address and property type required; phone required (no email field, as designed); decimals in rooms/area rejected (back `@IsInt`). RED observed per behavior. `npm test` 91 files / 597 tests (parent spot check: same), lint 0 errors, build green, `tsc --noEmit` clean. ~1,140 lines, mostly tests/CSS.

## Next step

T3 `/nosotros`.

# Feature 25 — Owner/seller focus, rental management, consortium team

**Objective:** reposition the public site so ~90% of it speaks to property owners who want to sell; the rest keeps consortium administration and buying/renting as they are. Add a dedicated "Administración de alquileres" section and button, show Ana María Fierro Pedrayes as the consortium administrator, and make the header slightly larger.

**Problem / why (owner request 2026-10-07):**
- The home says "vender **o alquilar**" everywhere, the nav opens with Comprar/Alquilar and the SEO title is "Venta y alquiler en CABA": the site speaks to everyone and convinces no one.
- Ana María Fierro Pedrayes (consortium administration, 15 years) does not appear anywhere.
- Rental management only exists as a small home block, with no page, form or button.
- The header is small (65px bar, 48px logo, 14px links) and hard to read.

## Decisions (owner, 2026-10-07)

- **Ana María Fierro Pedrayes is consortium-only.** She appears on `/administracion-de-consorcios` and at the top of `/nosotros` as "Administración: Ana María Fierro Pedrayes", with **15 años** of experience. Consortium copy offers "trato directo con Ana María Fierro Pedrayes y Gabriel Siricman".
- **Gabriel Siricman owns sales and everything else** (sell, buy, rent, rental management). Selling copy speaks in his name.
- Years of experience will be revisited later; for now any mention of Ana María uses 15. Existing "11 años" mentions tied to Gabriel/the company stay until the owner decides.
- Copy never promises what is not confirmed (no "best price", "free appraisal", "sold in N days").

## Recommended defaults (Claude, per autonomous-delivery)

- Nav: Inicio · Vender · Propiedades · Alquileres (administración) · Consorcios · Nosotros · Contacto; CTA "Tasá tu propiedad". The owner's uncommitted "Inicio" nav item and "Docente en UTN" fix are kept.
- Selling landing lives at `/vender`; `/tasaciones` redirects there permanently (308).
- Rental management: page `/administracion-de-alquileres`, new lead topic `rental_management` in the back (Postgres enum value via migration) so the inbox can filter it.

## Scope

- Header size (bar ~76px, logo 56px, wordmark 18px, links 15px) — adjust every consumer of `--site-header-height`.
- Home order: seller hero → trust strip → selling process → why sell with Gabriel → seller FAQ → rental management → consortium (compact) → "¿Buscás comprar o alquilar?" (one carousel) → final CTA.
- `/vender` (former `/tasaciones`): seller copy, "Vender" preselected, seller FAQ.
- `/administracion-de-alquileres`: what's included, how the handover works, FAQ, form → `type: contact`, `topic: rental_management`.
- `/nosotros`: Ana María at the top (consortium administration), team section with both.
- `/administracion-de-consorcios`: Ana María + Gabriel, trato directo.
- SEO metadata, sitemap, footer, contact topics, admin inbox topic labels.

## TDD

- Mode: strict TDD enabled (source: user global orchestrator config). Runners: front `npm test` (Vitest), back `npm test` (Jest). RED before GREEN; layouts checked at 390px and 1440px.

## Delivery

- Strategy: stacked-to-main, one PR per task, merged by Claude (autonomous delivery). Forecast ~1500 authored lines across both repos.
- Back B1 must be deployed (migration) before the front T4 form goes live; the owner runs server commands.

## Tasks

| ID | Task | Repo | Route | Status | Commit |
|----|------|------|-------|--------|--------|
| B1 | Lead topic `rental_management` (enum + migration + tests) | back | delegated | ✅ | 7ea7a0d (back #34) |
| T1 | Header: larger bar/logo/text, seller-first nav, CTA | front | delegated | ✅ | 34ff2c1 + glass fix |
| T2 | Home rewrite for sellers (sections + copy) + root SEO | front | delegated | ✅ | 1ccd958 |
| T3 | `/vender` landing (move `/tasaciones`, redirect, copy, FAQ) | front | delegated | ⬜ | |
| T4 | `/administracion-de-alquileres` page + form + topic labels | front | delegated | ⬜ | |
| T5 | Ana María in Nosotros (top) and Consorcios; team data | front | delegated | ⬜ | |
| T6 | Footer, contact page, WhatsApp messages, sitemap, metadata sweep | front | delegated | ⬜ | |

## Acceptance criteria

- First screen of the home and the nav speak to sellers; buying/renting remains reachable in one click.
- Rental management has its own nav button, page and form; leads show as "Administración de alquileres" in the inbox.
- Ana María appears only in consortium contexts, with 15 años.
- `npm run lint`, `npm test`, `npm run build` green (front); `npm test`, `npm run build` green (back).

## Progress

- 2026-10-07: analysis delivered, owner approved, doc created.
- B1 done: back #34 merged (enum value + migration, runs on startup). Verified: back `npm test` 573 passed, build OK, eslint clean on changed files. Owner must deploy the back before the rental form goes live.
- T1 done: header 76px, logo 56px, wordmark 18px, links 15px; nav Inicio · Vender · Propiedades · Alquileres · Consorcios · Nosotros · Contacto; desktop nav from 1100px (burger below). Glass header kept below 960px to match the hero. Verified: lint (0 errors; 1 pre-existing admin warning), `npm test` 1303 passed, build OK. `/vender` and `/administracion-de-alquileres` links 404 until T3/T4 merge.
- T2 done: home rewritten for sellers (hero with WhatsApp, trust strip, 5-step process, why sell + Gabriel card, seller FAQ, rental management, compact consortium band, buyers + one featured carousel, final CTA); HomeSections/AboutTeaser removed; root SEO title/description seller-focused. Links to `/vender` and `/administracion-de-alquileres` 404 until T3/T4.

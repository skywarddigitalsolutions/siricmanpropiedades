# Feature 1 — Front base

**Objective:** a runnable Next.js app with the design system foundations (tokens, fonts) and the shared public layout, ready for the next features to add pages.

**Why:** every later front feature (public site, admin panel) builds on this layout and these tokens; doing it once avoids re-deciding styling per page.

## Scope

- In: Next.js scaffold, test runner, design tokens, fonts, root layout, header (desktop nav + mobile menu), footer, floating WhatsApp button, placeholder home, README.
- Out: real pages (home content, results, detail, institutional), admin panel, Docker/deploy (feature 2), API calls.

## Constraints and decisions

- Next.js latest stable, App Router, TypeScript, `src/` dir, import alias `@/*`, npm.
- Styling: **CSS Modules + CSS custom properties** for tokens (no Tailwind). Reason: the design is plain CSS; tokens as variables map 1:1 and add no dependency.
- Fonts via `next/font/google`: Bodoni Moda (display), Manrope (public UI), Figtree (admin UI, loaded later by the admin layout).
- Icons: `lucide-react` (design uses lucide).
- Design reference: `design/sitio-web-v2.dc.html` (header, footer, nav, WhatsApp float, tokens). Logo: `public/logo-siricman.jpg`.
- Nav routes (Spanish, SEO-friendly): Comprar → `/propiedades?operacion=venta`, Alquilar → `/propiedades?operacion=alquiler`, `/tasaciones`, `/nosotros`, `/contacto`. Target pages do not exist yet.
- WhatsApp number `5491138967363`, default message "Hola Gabriel, te escribo desde la web.".
- UI copy in Spanish (site audience); code, identifiers, comments in English.

## TDD

- Mode: **strict TDD enabled** (source: user global orchestrator config "Strict TDD Mode: enabled").
- Runner: Vitest + @testing-library/react + jsdom (`npm test`). Set up in T1.

## Tasks

| ID | Task | Route | Status | Commit |
|----|------|-------|--------|--------|
| T1 | Scaffold Next.js + Vitest/RTL setup with a smoke test | delegated (writer trigger: 2+ files) | ⬜ | |
| T2 | Design tokens (`globals.css` variables) + fonts in root layout | delegated | ⬜ | |
| T3 | Header: logo, desktop nav, mobile menu toggle | delegated | ⬜ | |
| T4 | Footer + floating WhatsApp button (`buildWhatsAppLink` helper) | delegated | ⬜ | |
| T5 | Placeholder home + README rewrite | delegated | ⬜ | |

## Acceptance criteria

- `npm run dev` serves the placeholder home with header, footer and WhatsApp float matching the design tokens.
- Header shows nav on ≥960px and a menu button below; the menu opens/closes.
- `npm test`, `npm run lint` and `npm run build` pass.

## Checks per task

`npm test`, `npm run lint`, `npm run build` (build from T2 onward).

## Progress / evidence

- Branch: `feat/front-base`.

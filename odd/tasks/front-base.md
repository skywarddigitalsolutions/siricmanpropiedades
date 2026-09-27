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
| T1 | Scaffold Next.js + Vitest/RTL setup with a smoke test | delegated (writer trigger: 2+ files) | ✅ | `7e5eb4d` |
| T2 | Design tokens (`globals.css` variables) + fonts in root layout | delegated | ✅ | `c487e66` |
| T3 | Header: logo, desktop nav, mobile menu toggle | delegated | ✅ | `39f0821` |
| T4 | Footer + floating WhatsApp button (`buildWhatsAppLink` helper) | delegated | ✅ | `e410c24` |
| T5 | Placeholder home + README rewrite | delegated | ✅ | `762365a` |

## Acceptance criteria

- `npm run dev` serves the placeholder home with header, footer and WhatsApp float matching the design tokens.
- Header shows nav on ≥960px and a menu button below; the menu opens/closes.
- `npm test`, `npm run lint` and `npm run build` pass.

## Checks per task

`npm test`, `npm run lint`, `npm run build` (build from T2 onward).

## Progress / evidence

- Branch: `feat/front-base`.
- Next.js version scaffolded: **16.3.6** (App Router, TypeScript, ESLint, `src/` dir, alias `@/*`, npm, no Tailwind). React 19.2.8. Scaffolded via `create-next-app@latest` into a temp sibling dir (`front-scaffold-tmp`) and moved into the repo to avoid clobbering existing `design/`, `docs/`, `odd/`, `public/logo-siricman.jpg`.
- Vitest 5.0.2 required `@types/node` `^22 || >=24`; bumped from the scaffold's default `^20` to `^22` (matches installed Node 22.14) to satisfy the peer dependency — the only scaffold deviation.
- `.atl/` added to `.gitignore`; never committed.

### T1 — scaffold + Vitest/RTL

- `npm test`: 1 test file, 1 test passed (smoke test rendering the boilerplate home page).
- `npm run lint`: no errors.
- Commit `7e5eb4d` — includes pre-existing `design/`, `docs/`, `odd/`, `public/logo-siricman.jpg`.

### T2 — design tokens + fonts

- Tokens extracted from `design/sitio-web-v2.dc.html` into `src/app/globals.css` as CSS custom properties (colors, borders, text, radii, shadows, `--content-max-width: 1240px`).
- Fonts via `next/font/google`: `Bodoni_Moda` (weight 500, `--font-display`) and `Manrope` (weights 400–800, `--font-body`) in `src/app/layout.tsx`. `lang="es"`, metadata title "Siricman Propiedades" and Spanish description set.
- Removed create-next-app boilerplate styles (`--background`/`--foreground` vars, Arial font stack, dark-mode media query) from `globals.css`; simplified the placeholder `page.tsx`/`page.module.css` to drop the unused Geist fonts and missing `next.svg`/`vercel.svg` assets (those were never copied from the scaffold).
- `npm test`: 1 file, 1 test passed. `npm run lint`: no errors. `npm run build`: compiled and prerendered `/` and `/_not-found` successfully.
- Commit `c487e66`.

### T3 — Header (strict TDD)

- Behavior: desktop nav links render with correct hrefs; mobile menu opens/closes via buttons and Escape.
- RED: `npm test -- Header` → `Failed to resolve import "./Header" ... Does the file exist?` (1 test file failed, 0 tests, before `Header.tsx` existed).
- GREEN: `npm test -- Header` → `Test Files 1 passed (1)`, `Tests 3 passed (3)` after implementing `Header.tsx`.
- `src/components/layout/Header/{Header.tsx,Header.module.css,Header.test.tsx}`. Wired into `src/app/layout.tsx`.
- Full suite after: `npm test` → 2 files / 4 tests passed. `npm run lint`: no errors. `npm run build`: passed.
- Commit `39f0821`.

### T4 — Footer + WhatsAppButton (strict TDD)

- Behavior 1: `buildWhatsAppLink` encodes the message and strips non-digit characters from the phone.
  - RED: `npm test -- whatsapp` → `Failed to resolve import "./whatsapp"` (1 file failed, 0 tests).
  - GREEN: `npm test -- whatsapp` → `Test Files 1 passed (1)`, `Tests 3 passed (3)` after implementing `src/lib/whatsapp.ts`.
- Behavior 2: WhatsApp float button renders a link to the configured wa.me address, opens in a new tab.
  - RED: `npm test -- WhatsAppButton` → `Failed to resolve import "./WhatsAppButton"` (1 file failed, 0 tests).
  - GREEN: `npm test -- WhatsAppButton` → `Test Files 1 passed (1)`, `Tests 1 passed (1)`.
- Behavior 3: Footer renders brand, address, hours, phone/Instagram, professional line and copyright.
  - RED: `npm test -- Footer` → `Failed to resolve import "./Footer"` (1 file failed, 0 tests).
  - GREEN: `npm test -- Footer` → `Test Files 1 passed (1)`, `Tests 1 passed (1)`.
- `src/lib/whatsapp.ts` (+ `WHATSAPP_PHONE`, `WHATSAPP_DEFAULT_MESSAGE` constants), `src/components/layout/WhatsAppButton/*`, `src/components/layout/Footer/*`. Both wired into `src/app/layout.tsx` (Footer and WhatsAppButton render after `children`, alongside `Header`).
- Full suite after: `npm test` → 5 files / 9 tests passed. `npm run lint`: no errors. `npm run build`: passed.
- Commit `e410c24`.

### T5 — placeholder home + README

- Replaced the transitional placeholder with a hero block (brand, Spanish subtitle, "sitio en construcción" note) using the design's navy hero color and gold eyebrow token.
- Updated the smoke test (`src/app/page.test.tsx`) to assert the real heading and construction-note text.
- Rewrote `README.md` in UTF-8 English (previously UTF-16 garbage: `# siricmanpropiedades`); found and fixed via `iconv -f UTF-16LE -t UTF-8` after an editor tool round-trip preserved the original file's UTF-16LE encoding — verified `file README.md` reports UTF-8 before committing.
- `npm test`: 5 files / 9 tests passed. `npm run lint`: no errors. `npm run build`: passed.
- Commit `762365a`.

### Final verification (all tasks)

- `npm test`: **9/9 tests passed** across 5 test files.
- `npm run lint`: **no errors**.
- `npm run build`: **passed** (Next.js 16.3.6, Turbopack; `/` and `/_not-found` prerendered as static).

### Deviations from the doc

- `@types/node` bumped `^20` → `^22` (Vitest 5 peer requirement; matches installed Node 22.14).
- `lucide-react` pulled in `ChevronRight`/`Menu`/`X` for header fidelity with the design mock (doc only named lucide as the icon library, no specific icons).
- Home page content and copy were not specified beyond "hero-ish block ... 'sitio en construcción' note is fine"; wrote Spanish copy consistent with the design's tone and the root metadata description.

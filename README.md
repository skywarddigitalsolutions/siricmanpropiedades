# Siricman Propiedades — Front

Public-facing website for Siricman Propiedades, a real-estate agency in
Buenos Aires (CABA). Built with Next.js (App Router) and TypeScript.

This repository currently ships the front base: the app scaffold, design
tokens, fonts, and the shared public layout (header, footer, mobile menu,
floating WhatsApp button). Real pages (home content, listings, property
detail, institutional pages) and the admin panel are delivered in later
features — see [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript, `src/` directory)
- CSS Modules + CSS custom properties for design tokens (no CSS framework)
- [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com)
  for unit/component tests
- [lucide-react](https://lucide.dev) for icons

## Scripts

```bash
npm run dev        # start the dev server
npm run build       # production build
npm run start       # run the production build
npm run lint         # eslint
npm test              # run the test suite once (vitest run)
npm run test:watch    # run the test suite in watch mode
```

## Project structure

```
src/
  app/                     # App Router routes, root layout, global styles
  components/
    layout/                # shared layout pieces (Header, Footer, WhatsAppButton)
  lib/                     # framework-agnostic helpers (e.g. whatsapp.ts)
design/                    # design reference (static HTML mockup)
docs/                      # project docs (roadmap, decisions)
odd/                       # Organic Driven Development task tracking
public/                    # static assets (logo, etc.)
```

Components follow a small, focused convention: one folder per component with
its implementation, CSS Module, and test co-located
(`Header.tsx` + `Header.module.css` + `Header.test.tsx`).

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `API_INTERNAL_URL` | Yes, for the admin panel | Server-only base URL of the internal API (e.g. `http://api:3000` in production, via Docker's internal network). It has no `NEXT_PUBLIC_` prefix, so it is never inlined into the client bundle, and it is read from `process.env` at request time, not at build time. For local dev, point it at the local API instance — e.g. `API_INTERNAL_URL=http://localhost:3001` when the API runs with `PORT=3001` (since `next dev` already takes port 3000). |

There is no `JWT_SECRET` in this repository. The front never verifies or
issues JWTs; it only forwards the bearer token it receives from the API in
an httpOnly cookie. Token verification stays entirely in
`back-siricmanpropiedades`.

### Admin routes

`/admin/**` is a Backend-For-Frontend for the admin panel: the Next.js
server holds the API bearer token in an httpOnly cookie, and the browser
never sees it. `src/proxy.ts` redirects unauthenticated requests to
`/admin/login`; actual session validity is re-checked server-side on every
admin page via `GET /api/auth/me`.

## Design reference

`design/sitio-web-v2.dc.html` is the original design mockup for the public
site (header, nav, mobile menu, footer, WhatsApp float, and page layouts).
Design tokens (colors, radii, shadows) in `src/app/globals.css` are extracted
from it.

## Roadmap

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the full feature roadmap and
pending product decisions.

# Roadmap

Legend: SDD = spec-driven (hard-to-reverse decisions), ODD = organic (clear path).

| # | Feature | Repo | Method | Status |
|---|---------|------|--------|--------|
| 0 | Server setup: VPS hardening + DNS | infra | — | ✅ Done |
| 1 | Front base: Next.js scaffold, design tokens, fonts, layout (header, footer, mobile menu, floating WhatsApp) | front | ODD | ✅ Done |
| 2 | Early deploy: Dockerfiles, production compose, Caddy (HTTPS) | both | ODD | ✅ Done |
| 3 | Properties domain (back): entity, migrations, admin CRUD, public listing with filters | back | SDD | ⬜ |
| 4 | Images: upload, WebP conversion, ordering/cover, storage | back | SDD | ⬜ |
| 5 | Admin session: login + MFA from Next, token strategy | both | SDD | ⬜ |
| 6 | Admin panel: property list and editor | front | ODD | ⬜ |
| 7 | Public site: home, results, property detail (SEO) | front | ODD | ⬜ |
| 8 | Leads: site forms + admin inbox | both | ODD | ⬜ |
| 9 | Institutional pages (Tasaciones, Nosotros, Contacto) + map | front | ODD | ⬜ |
| 10 | Daily DB backups + monitoring | infra | ODD | ⬜ |

## Pending product decisions

Resolve each one when its feature starts.

- [ ] Price sorting across USD/ARS (design mock uses a fixed 1200 rate) — feature 3
- [ ] Neighborhoods: fixed CABA list or open? — feature 3
- [ ] Image storage: local disk vs Cloudflare R2 — feature 4
- [ ] Admin token strategy: httpOnly cookie via Next (BFF) vs bearer in browser; refresh token — feature 5
- [ ] Map provider: Google Maps vs OpenStreetMap — feature 9
- [ ] Email notification on new leads? — feature 8

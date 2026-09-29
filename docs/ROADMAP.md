# Roadmap

Legend: SDD = spec-driven (hard-to-reverse decisions), ODD = organic (clear path).

| # | Feature | Repo | Method | Status |
|---|---------|------|--------|--------|
| 0 | Server setup: VPS hardening + DNS | infra | — | ✅ Done |
| 1 | Front base: Next.js scaffold, design tokens, fonts, layout (header, footer, mobile menu, floating WhatsApp) | front | ODD | ✅ Done |
| 2 | Early deploy: Dockerfiles, production compose, Caddy (HTTPS) | both | ODD | ✅ Done |
| 3 | Properties domain (back): entity, migrations, admin CRUD, public listing with filters | back | SDD | ✅ Done |
| 4 | Images: upload, WebP conversion, ordering/cover, storage | back | SDD | ✅ Done |
| 5 | Admin session: login + MFA from Next, token strategy | both | SDD | ⬜ |
| 6 | Admin panel: property list and editor | front | ODD | ⬜ |
| 7 | Public site: home, results, property detail (SEO) | front | ODD | ⬜ |
| 8 | Leads: site forms + admin inbox | both | ODD | ⬜ |
| 9 | Institutional pages (Tasaciones, Nosotros, Contacto) + map | front | ODD | ⬜ |
| 10 | Daily DB backups + monitoring | infra | ODD | ⬜ |

## Pending product decisions

Resolve each one when its feature starts.

- [x] Price sorting across USD/ARS — feature 3: no conversion; sort and price range apply within one currency (price sort/range without `currency` returns 400)
- [x] Neighborhoods — feature 3: the 48 official CABA barrios seeded by migration; admin/manager can add new ones
- [x] Image storage — feature 4: local disk (Docker volume `media_data`) behind a `StoragePort`, served by Caddy at `/media/*`; an R2 adapter can be added later without domain changes
- [ ] Back up the `media_data` volume (not covered by `pg_dump`) — feature 10
- [ ] Admin token strategy: httpOnly cookie via Next (BFF) vs bearer in browser; refresh token — feature 5
- [ ] Public catalog: expose a `featured` filter? — feature 7
- [ ] API rate limit (global throttler, 20 req/min per IP) vs server-side fetching of the public catalog — before features 6/7
- [ ] Restrict deal status `sold` to sale and `rented` to rent operations? — feature 6
- [ ] Map provider: Google Maps vs OpenStreetMap — feature 9
- [ ] Email notification on new leads? — feature 8

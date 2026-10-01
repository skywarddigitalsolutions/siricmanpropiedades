# Roadmap

Legend: SDD = spec-driven (hard-to-reverse decisions), ODD = organic (clear path).

| # | Feature | Repo | Method | Status |
|---|---------|------|--------|--------|
| 0 | Server setup: VPS hardening + DNS | infra | — | ✅ Done |
| 1 | Front base: Next.js scaffold, design tokens, fonts, layout (header, footer, mobile menu, floating WhatsApp) | front | ODD | ✅ Done |
| 2 | Early deploy: Dockerfiles, production compose, Caddy (HTTPS) | both | ODD | ✅ Done |
| 3 | Properties domain (back): entity, migrations, admin CRUD, public listing with filters | back | SDD | ✅ Done |
| 4 | Images: upload, WebP conversion, ordering/cover, storage | back | SDD | ✅ Done |
| 5 | Admin session: login + MFA from Next, token strategy | both | SDD | ✅ Done |
| 6 | Admin panel: property list and editor | front | ODD | ✅ Done |
| 7 | Public site: home, results, property detail (SEO) | front | ODD | ✅ Done |
| 8 | Leads: site forms + admin inbox | both | ODD | ✅ Done |
| 8.1 | Remove SMTP lead emails + contact email in the footer (`odd/tasks/remove-smtp-footer-email.md`) | both | ODD | ✅ Done |
| 9 | Institutional pages (Tasaciones, Nosotros, Contacto) + map (`odd/tasks/institutional-pages.md`) | front | ODD | ✅ Done |
| 10 | Daily DB backups + uptime monitoring (back `odd/tasks/backups-monitoring.md`, back #27) | infra | ODD | ✅ Done |
| 11 | Enforce deal status vs operation in the back (back `odd/tasks/deal-status-operation-rule.md`) | both | ODD | ✅ Done |
| 12 | Security hardening + admin on `admin.` host (back `odd/tasks/security-hardening.md`, back #30, front #41) | both | ODD | ✅ Done |
| 13 | UX quick wins: custom selects, WhatsApp icon, tags, admin login redesign, footer + legal pages (`odd/tasks/ux-quick-wins.md`) | front | ODD | ✅ Done |
| 14 | Home: typeahead location search, hero photo, featured sale/rent sections | front | ODD | ✅ Done |
| 15 | Admin: clients view (deduped by email) + friendlier leads inbox | both | ODD | ⬜ |
| 16 | Admin: property list (thumbnails, search, sort) + editor (steps, validated address + map, photos, preview) | both | ODD | ⬜ |
| 17 | Public favorites (browser-stored) | front | ODD | ⬜ |
| 18 | Admin home, my account (password, backup codes), users management | both | ODD | ⬜ |
| 19 | Results, property detail redesign, forms and accessibility | front | ODD | ⬜ |

## Pending product decisions

Resolve each one when its feature starts.

- [x] Price sorting across USD/ARS — feature 3: no conversion; sort and price range apply within one currency (price sort/range without `currency` returns 400)
- [x] Neighborhoods — feature 3: the 48 official CABA barrios seeded by migration; admin/manager can add new ones
- [x] Image storage — feature 4: local disk (Docker volume `media_data`) behind a `StoragePort`, served by Caddy at `/media/*`; an R2 adapter can be added later without domain changes
- [x] Back up the `media_data` volume — feature 10: covered by DonWeb's weekly server backup ("Backup: Premium Semanal"); the daily `pg_dump` covers the database only, kept on the VPS (last 7, skipped below 2 GB free)
- [x] Admin token strategy — feature 5: Next BFF with an httpOnly cookie (JWT never reaches the browser), no refresh token (60-min session, reactive expiry); BFF forwards the client IP so throttling stays per user
- [x] Public catalog: expose a `featured` filter — feature 7: yes (`featured=true`, home "Destacadas"), plus a `code` filter for code lookups
- [x] API rate limit vs server-side fetching of the public catalog — feature 7: pages render per request with Next's 60 s data cache; public catalog reads get their own 300 req/min per-IP limit (the Next container shares one IP)
- [x] Restrict deal status `sold` to sale and `rented` to rent operations — feature 6: yes, enforced in the admin panel; back enforcement is a follow-up
- [x] Back: enforce sold/rented vs operation — feature 11: the back rejects incompatible deal statuses and operation changes that would break the rule (back #29); the editor explains the rejection
- [x] Map provider — feature 9: Google Maps keyless iframe embed (no lat/lng stored); exact address query when `showExactAddress`, otherwise the barrio with a "Zona aproximada" chip
- [x] Email notification on new leads — decided 2026-10-01: no mail service. Leads stay in the panel inbox and are answered by WhatsApp; the site shows a public contact email (mailto). The SMTP notifier from feature 8 was removed in feature 8.1 (back #26); the footer links `info@siricmanpropiedades.com.ar` (`CONTACT_EMAIL` in `src/lib/contact.ts`)

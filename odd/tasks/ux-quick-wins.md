# Feature 13 — UX quick wins

**Objective:** fix the most visible UI annoyances reported by the owner and found in the 2026-10-01 UX audit, with small, low-risk changes.

**Problem / why:** native selects render the OS arrow glued to the pill edge ("Más recientes"), the WhatsApp glyph is hand-drawn and looks wrong, the "Oportunidad" tag color clashes with photos, the admin login/MFA screens are a bare card, the footer shows a `[a completar]` placeholder and non-link legal text, the admin uses the Bodoni display font for titles where it looks out of place, and footer phone/Instagram are not tappable.

## Scope

- In: shared public `Select` component (appearance none, custom chevron, 16px font) applied to the 6 non-hero public selects; official WhatsApp glyph in the shared `WhatsAppIcon`; floating button safe-area + desktop label; "Oportunidad"/marketing tags restyled; admin login + MFA screens redesigned (brand panel, logo, show-password toggle); admin titles switched from Bodoni to Manrope; footer: remove matrícula line (user decision), real links for phone (`tel:`), WhatsApp, Instagram, Términos and Privacidad; new `/terminos` and `/privacidad` pages; global `not-found` page with site header/footer; card hover only on hover-capable devices + `prefers-reduced-motion`.
- Out: hero search and home sections (feature 14), admin selects (features 15/16), results/detail work (feature 19).

## Constraints and decisions

- User decision (2026-10-01): remove the CUCICBA matrícula line for now.
- User decision (2026-10-01): admin login stays publicly reachable (no extra access layer); `/admin` on the apex keeps redirecting to the admin host. No "forgot password" flow.
- Legal pages are a reasonable template (Ley 25.326 notice for lead data, contact `CONTACT_EMAIL`); the owner should review the wording.
- Mobile-first; reuse site tokens; Spanish UI copy (neutral, voseo like the rest).

## TDD

- Mode: strict TDD enabled (source: user global orchestrator config). Runner: `npm test` (Vitest). RED observed before GREEN for components with behavior; pure CSS changes are verified by build + review.

## Tasks

| ID | Task | Route | Status | Commit |
|----|------|-------|--------|--------|
| T1 | Shared public `Select` + apply to public selects (excluding hero) | delegated (writer trigger: 2+ files) | ⬜ | |
| T2 | Official WhatsApp glyph, floating button safe-area + label, footer links, tags restyle, card hover/reduced motion | delegated | ⬜ | |
| T3 | Footer matrícula removal, `/terminos`, `/privacidad`, global `not-found` | delegated | ⬜ | |
| T4 | Admin login + MFA screens redesign; admin titles to Manrope | delegated | ⬜ | |

## Acceptance criteria

- Every public select (except hero, feature 14) uses the shared component, chevron with right padding, 16px text.
- WhatsApp icon is the official glyph everywhere it is used.
- Footer has no placeholder; legal links resolve to real pages; unknown URLs show the branded 404.
- Admin login and MFA screens show the brand; no Bodoni in admin UI titles.
- `npm run lint`, `npm test`, `npm run build` green.

## Progress

- 2026-10-01: feature started, branch `feat/ux-quick-wins`, roadmap rows 12–19 added. RDD: off (default).

## Next step

T1–T4 (one writer).

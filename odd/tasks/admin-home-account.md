# Feature 18 — Admin: home, my account, users and visual polish

**Objective:** a panel that feels friendly and complete: a home dashboard, self-service account settings, users management, and a polished look (icons where they help, clear status colors, real pagination).

**Problem / why (owner feedback 2026-10-01, with screenshots):** the panel looks empty and unfriendly; "Nueva propiedad" has no "+" icon; the filter block is badly placed; pagination is "Anterior · Página 1 de 1 · Siguiente" with no highlighted current page; the sidebar user block is just the name "admin" and an ugly outlined "Cerrar sesión" pill; navy buttons get gold text on hover/active which is horrible; status badges (Publicada / Disponible) are pale grey and don't communicate meaning; few icons. There is no home dashboard (the panel redirects to Propiedades), no "Mi cuenta", and no users screen.

## Scope

- Home `/admin`: KPIs (consultas nuevas, borradores, publicadas sin fotos, totales), últimas 5 consultas, quick actions (Nueva propiedad, Ver consultas). Uses `GET /admin/dashboard`.
- Mi cuenta `/admin/cuenta`: change password (current + new + confirm + MFA code; on success swap the BFF session cookie to the returned token), regenerate backup codes (TOTP required; show once with copy/download).
- Usuarios `/admin/usuarios` (admin only): list with role and active state, create user (role select), activate/deactivate, reset password.
- Visual polish across the admin: "+" icon on "Nueva propiedad"; icons in nav items and key actions (lucide-react, used consistently — not everywhere); semantic status badges (publicada = green, borrador = amber/neutral, archivada = grey; disponible = green, reservada = amber, vendida/alquilada = red/blue) shared by list, editor and dashboard; numbered pagination with the current page in a filled navy circle with white text, prev/next as icon buttons; sidebar user card (avatar circle with initials or user icon, name, role) and a friendly "Cerrar sesión" (icon + text, subtle button); fix button hover/active states (no gold text on navy); filters block re-laid out (search + filters inline on desktop, collapsible on mobile).
- Out: notes/CRM, email features.

## Constraints and decisions

- Back contracts: `../back-siricmanpropiedades/odd/tasks/admin-api-extensions.md` (merged back #31). `PATCH /auth/password` returns a fresh session token; wrong password/code → 400.
- No "forgot password" flow (user decision 2026-10-01).
- Mobile-first; site tokens; Spanish UI copy with voseo.

## TDD

- Mode: strict TDD enabled (source: user global orchestrator config). Runner: `npm test` (Vitest). RED observed before GREEN.

## Tasks

| ID | Task | Route | Status | Commit |
|----|------|-------|--------|--------|
| T1 | Visual system: semantic status badges, buttons states, numbered pagination, sidebar user card + logout, nav icons, "+" on Nueva propiedad, filter layout | delegated | ⬜ | |
| T2 | Home dashboard | delegated | ⬜ | |
| T3 | Mi cuenta: change password (cookie swap) + regenerate backup codes | delegated | ⬜ | |
| T4 | Usuarios (admin only) | delegated | ⬜ | |

## Acceptance criteria

- The owner's listed issues are all addressed; `npm run lint`, `npm test`, `npm run build` green.

## Progress

- 2026-10-01: feature started in worktree `front-siricmanpropiedades-worktrees/admin-home-account`, branch `feat/admin-home-account`. RDD: off (default).

## Next step

T1.

# Feature 22 — UX corrections (owner review 2026-10-02)

**Objective:** close the owner's second round of visual corrections.

**Problem / why (owner screenshots):**
- Hero "Tipo" and "Ambientes" open the OS native list (blue highlight, square, unstyled) while "Ubicación" opens the site's styled suggestions panel. Every dropdown on the site and the admin must look like the Ubicación panel.
- "Mi cuenta" should not be a nav section; it belongs to the sidebar user card (avatar + name) as a gear icon on the right. The page itself is a long single column with lots of empty space → two columns, less scroll, better design.
- "Cerrar sesión" sits under the user card; it must go above the divider line that separates the user card.
- Clientes table: name and email glued together on one line; contact column cramped (phone + stacked buttons); "1 consulta" glued to "Ver consultas"; "hace 11 horas" glued to the date. Same compact/glued problem in the Consultas inbox and the dashboard "Últimas consultas". Buttons and labels need breathing room.
- Propiedades filters: "Ordenar por" is misaligned (its hint text pushes it up out of the row), selects unstyled.
- New landscape hero photo committed (`public/hero.jpg`, 2560px) and unused images removed (`hero.jpeg`, `logo-siricman.jpg`).

## Scope

- One custom accessible dropdown (button + `role="listbox"` popup styled exactly like the `LocationCombobox` panel: white card, radius, shadow, 44px rows, hover/active row tint, check on selected) used by the public shared `Select` and the admin `SelectField`, keeping form semantics (hidden input with `name`, `onChange` for auto-submit uses).
- Admin shell: remove "Mi cuenta" nav item; user card with gear link; logout above the divider.
- Mi cuenta two-column layout.
- Spacing/typography fixes for Clientes, Consultas, dashboard lists.
- Propiedades filters aligned grid; hint moved so it never breaks alignment.
- Out: new features.

## TDD

- Mode: strict TDD enabled (source: user global orchestrator config). Runner: `npm test` (Vitest). RED observed before GREEN for the dropdown behaviour; layout verified by screenshots.

## Tasks

| ID | Task | Route | Status | Commit |
|----|------|-------|--------|--------|
| T0 | New hero photo (optimized to 2560px) + remove unused images | inline (mechanical) | ✅ | b5e7cb9 |
| T1 | Custom `Dropdown` (listbox) + adopt in public `Select` and admin `SelectField` | delegated | ⬜ | |
| T2 | Admin shell: gear on user card, logout above divider, no "Mi cuenta" nav; Mi cuenta two columns | delegated | ⬜ | |
| T3 | Clientes / Consultas / dashboard list spacing; Propiedades filters alignment | delegated | ⬜ | |

## Acceptance criteria

- No native select popup anywhere; all dropdowns look like the Ubicación panel and work with keyboard and touch.
- Screenshots of the public site at 1440/390 checked; admin layouts described (MFA blocks automated login).
- `npm run lint`, `npm test`, `npm run build` green.

## Progress

- 2026-10-02: branch `feat/ux-corrections`; T0 committed. RDD: off (default).

## Next step

T1.

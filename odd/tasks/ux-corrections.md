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
| T1 | Custom `Dropdown` (listbox) + adopt in public `Select` and admin `SelectField` | delegated | ✅ | 2d6b1f2 |
| T2 | Admin shell: gear on user card, logout above divider, no "Mi cuenta" nav; Mi cuenta two columns | delegated | ✅ | 4f317a8 |
| T3 | Clientes / Consultas / dashboard list spacing; Propiedades filters alignment | delegated | ✅ | 4ce6c83 |

## Acceptance criteria

- No native select popup anywhere; all dropdowns look like the Ubicación panel and work with keyboard and touch.
- Screenshots of the public site at 1440/390 checked; admin layouts described (MFA blocks automated login).
- `npm run lint`, `npm test`, `npm run build` green.

## Progress

- 2026-10-02: branch `feat/ux-corrections`; T0 committed. RDD: off (default).
- T1: RED = `Dropdown.test.tsx` failed (module missing); GREEN = 18/18. Public `Select` keeps its `<option>`-children API (parsed into options) and `SelectField` keeps its props; `onChange` is now `(value, form)` and the hidden input is written before it fires so call sites can `form.requestSubmit()`. Existing tests moved to `src/test/dropdown.ts` helpers (`pick`, `openLabels`, `dropdownValue`). Screenshots (public, 1440 and 390, owner dev server): `f22-hero-ubicacion-*`, `f22-hero-tipo-*`, `f22-hero-ambientes-*`, `f22-sort-*`, `f22-contact-*` in the session scratchpad; the panel matches the Ubicación card (flips above when no room, right-aligns near the viewport edge).
- T2: RED = 6 failing panel tests, GREEN = 42/42 panel tests plus the account page column test. Gear link (`Mi cuenta`) on the user card, logout above the divider (sidebar and drawer), two-column account page from 1024px (profile + backup codes left, password right; form is 2-column by container query).
- T3: ClientTable cells wrap their lines in a flex stack (table cells cannot be flex, which glued the lines); inbox and dashboard rows get gaps and a dot separator; property filters are an auto-fill grid with the Sin fotos / note / Limpiar footer, the price-sort note shows only while the sort control is focused. Admin layouts are not screenshot-verified (MFA); described from CSS.
- Verification: `npm run lint` 0 errors (1 pre-existing img warning), `npm test` 1178 passed, `npm run build` OK.

## Next step

Push, PR, deploy.

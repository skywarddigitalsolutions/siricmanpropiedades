# Feature 15 — Admin: clients view + friendlier leads inbox

**Objective:** the owner can see every person who left an email (no duplicates), export them, and handle inquiries quickly from the inbox.

**Problem / why:** there is no clients view; the inbox cannot be searched, rows don't show the contact channel or property, replying by WhatsApp does not mark the lead as contacted, and the status change is a native select plus a separate save button.

## Scope

- In: "Clientes" admin section (list with search, pagination, per-client details: name, email, phone, inquiries count, first/last inquiry, properties asked about; CSV export button; links to that client's inquiries); inbox: search box, status tabs with counts, rows with property code chip, contact line and quick actions (WhatsApp, "Contactada"), lead detail: "Abrir WhatsApp y marcar como contactada" combined action, status as a 3-button segmented control, "N consultas de esta persona" link, `consultas` loading skeleton.
- Out: CRM features (notes, tags), phone-only clients.

## Constraints and decisions

- Back contracts: `back-siricmanpropiedades/odd/tasks/admin-api-extensions.md` (section "Endpoint contracts"), merged in back #31.
- Clients and leads are admin + manager; the CSV is personal data (audited by the back).
- The browser never calls the API: all calls go through the BFF (server actions / server components), including the CSV download (a route handler or server action streaming the back response with the session token).

## TDD

- Mode: strict TDD enabled (source: user global orchestrator config). Runner: `npm test` (Vitest). RED observed before GREEN.

## Tasks

| ID | Task | Route | Status | Commit |
|----|------|-------|--------|--------|
| T1 | API client + "Clientes" page (search, list/cards, pagination, CSV export) + nav item | delegated (writer trigger: 2+ files) | ✅ | `e3ed82a` |
| T2 | Inbox: search, status tabs with counts, richer rows with quick actions, loading skeleton | delegated | ✅ | `a7268ac` |
| T3 | Lead detail: WhatsApp + mark contacted, segmented status, "consultas de esta persona" | delegated | ✅ | `6c6601f` |

## Acceptance criteria

- Clientes lists one row per email, searchable by name/email/phone, exports CSV.
- Inbox searchable; tabs show counts; reply by WhatsApp in one tap marks the lead as contacted.
- Mobile-first, consistent with the admin theme.
- `npm run lint`, `npm test`, `npm run build` green.

## Progress

- 2026-10-01: feature started, branch `feat/admin-clients-inbox`. RDD: off (default).
- 2026-10-01: T1-T3 done (RDD off). Verification: lint 0 errors, 768/768 tests, build green.
  - T1 RED: 4 new suites failed to resolve their modules + nav and mailto tests failing; GREEN after `clients.ts`, `clients-params.ts`, `ClientTable`, page and route handler. Route handler `/admin/clientes/export` streams the back CSV through `apiFetchRaw` (new, shared request logic with `apiFetch`).
  - T2 RED: 10 tests failing (inbox params, page, quick actions); GREEN after `q`/`propiedad` params, `counts` pills, new row layout and `LeadQuickActions`.
  - T3 RED: 11 tests failing (segmented control, WhatsApp reply link, person link); GREEN after rewriting `LeadManagePanel` (`useOptimistic` + rollback), `WhatsAppReplyLink` and the detail page.
  - Decisions: WhatsApp is a real `target="_blank"` link whose click handler calls the server action (no `window.open`, so no popup blocker and no inline JS under the CSP); tabs reordered Todas/Nuevas/Contactadas/Cerradas, default stays Nuevas; the "N consultas de esta persona" count comes from `GET /admin/leads?q=<email|phone>&limit=1` (`q` also matches message text, so it can overcount slightly); malformed `propiedad` ids are ignored client-side because the back answers 400; mailto emails lose `?`/`&` (audit LOW).

## Next step

Push, PR, deploy.

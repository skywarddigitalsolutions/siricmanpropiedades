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
| T1 | API client + "Clientes" page (search, list/cards, pagination, CSV export) + nav item | delegated (writer trigger: 2+ files) | ⬜ | |
| T2 | Inbox: search, status tabs with counts, richer rows with quick actions, loading skeleton | delegated | ⬜ | |
| T3 | Lead detail: WhatsApp + mark contacted, segmented status, "consultas de esta persona" | delegated | ⬜ | |

## Acceptance criteria

- Clientes lists one row per email, searchable by name/email/phone, exports CSV.
- Inbox searchable; tabs show counts; reply by WhatsApp in one tap marks the lead as contacted.
- Mobile-first, consistent with the admin theme.
- `npm run lint`, `npm test`, `npm run build` green.

## Progress

- 2026-10-01: feature started, branch `feat/admin-clients-inbox`. RDD: off (default).

## Next step

T1.

# Feature 26 — Admin panel: lead categories, status colors, icon actions, Spanish CSV

**Objective:** make the admin panel tell lead kinds apart at a glance (appraisals vs. buy/rent searches vs. management vs. other), show statuses with colors, use icon actions, and export a CSV that opens correctly in Spanish Excel.

**Problem / why (owner review 2026-10-08):**
- Dashboard: "Consultas nuevas" mixes appraisal requests with buy/rent inquiries; the owner wants them separated.
- Inbox: every lead card looks the same (gold left border only for "new"); the type is hard to spot.
- Lead detail: the status control is navy for every status; "Eliminar consulta" has no icon and a plain confirm.
- Properties list: "Ver en el sitio" / "Retirar" are tall text pills; the owner wants icon actions.
- Clients CSV: English headers, ISO dates, comma separator → Spanish Excel puts everything in column A.
- The owner wants to see what happens when a client has no properties or a lead's property no longer exists, with example data.

## Decisions (Claude, autonomous delivery)

- **Lead category** (derived, back + front share the same rule):
  - `appraisal`: `type = appraisal`.
  - `search`: `type = property_inquiry`, or `type = contact` with topic `buy` | `rent`. Label "Compra y alquiler".
  - `management`: `type = contact` with topic `rental_management` | `consortium`. Label "Administración".
  - `other`: everything else (contact with topic `sell`, `other` or none). Label "Otras".
- Back contract: `GET /admin/leads?category=appraisal|search|management|other` (combinable with status/q/etc.); `GET /admin/dashboard` adds `leads.newByCategory: { appraisal, search, management, other }` and `topic` in each `latestLeads` item.
- Status colors: new = info (blue), contacted = warning (amber), closed = success (green), in badges and in the detail segmented control.
- Example data: back CLI `npm run demo:leads -- seed|remove` (manifest-based like `demo:properties`), run only against the local dev DB.
- CSV: `;` separator, UTF-8 BOM, Spanish headers, dates `dd/mm/aaaa hh:mm` (America/Argentina/Buenos_Aires), properties joined with ", ".

## TDD

- Mode: strict TDD (user global config). Runners: front `npm test` (Vitest), back `npm test` (Jest).

## Delivery

- Stacked-to-main, one PR per repo slice, merged by Claude. Back first (contract), then front.

## Tasks

| ID | Task | Repo | Route | Status | Commit |
|----|------|------|-------|--------|--------|
| B2 | `category` filter on admin leads + dashboard `newByCategory` + `topic` in latest leads | back | delegated | ✅ | 9842794 (back #35) |
| B3 | `demo:leads` CLI (seed/remove): leads of every category, a lead whose property was deleted, a client with no property inquiries | back | delegated | ✅ | 41a2d3f (back #35) |
| B4 | Clients CSV export: Spanish headers, `;`, BOM, formatted dates (if the export is built in the back) | back | delegated | ✅ | 0ad25d1 (back #35) |
| T13 | Dashboard: KPI cards per category + category badge in "Últimas consultas" | front | delegated | ✅ | 6ff2543 |
| T14 | Inbox: category chips filter + category icon/label/left border on each card | front | delegated | ✅ | e376a58 |
| T15 | Lead detail: colored status control, delete with trash icon + confirm dialog | front | delegated | ✅ | 70771a5 |
| T16 | Properties list: icon actions with tooltips/aria-labels | front | delegated | ✅ | 8bc6623 |
| T17 | Clients CSV export in Spanish (front route only proxies the back CSV → covered by B4) | front | — | n/a | |

## Acceptance criteria

- Dashboard shows new appraisals and new buy/rent inquiries separately.
- Inbox cards show the category with icon + color; chips filter by category.
- Statuses are colored everywhere; delete has a trash icon and a clear confirmation.
- Property row actions are icons with accessible names and tooltips.
- The CSV opens in Spanish Excel with one value per column, Spanish headers and readable dates.
- Local example data shows a lead whose property was deleted and a client with no properties.

## Progress

- 2026-10-08: mapped; doc created.
- 2026-10-08: T13–T16 done on `feat/admin-leads-categories` (lint, 1392 tests, build green; no authenticated screenshots, admin needs login+MFA).
- 2026-10-08: back #35 merged (categories, demo:leads, Spanish CSV; 605 tests). Local dev DB seeded with demo leads (remove with `npm run demo:leads -- remove` in the back). Front T13–T16 verified by tests only (admin needs login + MFA); owner to review visually.

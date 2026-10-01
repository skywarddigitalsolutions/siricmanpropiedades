# Feature 8 — Leads: site forms + admin inbox

**Objective:** a visitor can send an inquiry about a property from its page; admins and managers see every lead in an inbox, mark its progress, keep notes and reply by phone, email or WhatsApp — on a phone first.

**Why:** the public site (feature 7) only offers WhatsApp; inquiries are lost in chats and nothing records them. A lead inbox turns traffic into tracked contacts.

## Scope

- Back: `leads` domain (entity, migration, public `POST /api/leads` with anti-spam, admin list/detail/update/delete), audit records, email notification on new leads behind a port.
- Front: inquiry form on the property page (keeps the WhatsApp action), admin "Consultas" nav item with a new-leads badge, inbox list with filters, lead detail (contact actions, status, notes, admin-only delete).
- Out: appraisal and contact forms (feature 9 builds them on the same endpoint — the model already supports them), lead assignment to users, replying from the panel, CSV export.

## Constraints and decisions

- **Lead model (covers features 8 and 9):** `type` = `property_inquiry | appraisal | contact`; `name` (2–100), `phone` and `email` (at least one required), `message` (≤ 2000, optional), `propertyId` (nullable FK, `ON DELETE SET NULL`), `topic` (contact form: `buy | rent | sell | consortium | other`, nullable), `details` (jsonb, appraisal data, nullable), `status` = `new | contacted | closed` (default `new`), `notes` (internal, ≤ 2000), timestamps. No IP or user agent stored (not needed; throttling covers abuse).
- **Anti-spam:** `POST /api/leads` throttled to 5 req/min per IP (the BFF forwards the visitor IP, already implemented in `apiFetch`); a honeypot field (`website`) that must stay empty — when filled the API answers 201 without saving, so bots don't learn. A property inquiry must reference a published property.
- **Email notification (ROADMAP decision): yes**, via a `LEAD_NOTIFIER` port. `SmtpLeadNotifier` (nodemailer) is used when `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` and `LEADS_NOTIFY_TO` are set (Google Workspace SMTP with an app password); otherwise `LogLeadNotifier` only logs. Sending is fire-and-forget after the lead is saved: an email failure never fails the visitor's request.
- **Roles:** admin and manager read/update leads; delete is admin-only (spam cleanup), mirroring properties.
- **Front:** mobile first, same panel theme; the public form is a Server Action through the BFF (no API exposed to the browser), accessible errors, success state per design ("¡Gracias por tu consulta!").
- Code and comments in English (back keeps its Spanish JSDoc style where it already uses it); UI copy in Spanish.

## TDD

- Mode: **strict TDD enabled** (source: user global orchestrator config). Back: Jest (`npm test`). Front: Vitest + RTL (`npm test`).

## Delivery

- Forecast well above 400 authored lines; `auto-chain`, `stacked-to-main`, one PR per task, merged before the next (autonomous delivery authorized). Tasks run inline: subagents are rate-limited until 2026-10-03.

## Tasks

| ID | Task | Repo | Route | Status | Commit / PR |
|----|------|------|-------|--------|-------------|
| B1 | Leads domain: entity + migration, public create (validation, honeypot, throttle), admin list/detail/update/delete, audit | back | inline (subagents rate-limited) | ✅ | back #24 |
| B2 | Lead notifier port: log adapter + SMTP adapter (nodemailer), config, deploy docs | back | inline | ✅ | back #25 |
| T1 | Leads API client (public + admin) and the inquiry form on the property page | front | inline | ✅ | `2842f50` |
| T2 | Admin inbox: "Consultas" nav with new-leads badge, list with filters and pagination | front | inline | ⬜ | |
| T3 | Admin lead detail: contact actions, status, notes, admin-only delete | front | inline | ⬜ | |
| T4 | Browser walkthrough (375 / 1280), ROADMAP close-out | both | inline | ⬜ | |

## Acceptance criteria

- From a property page a visitor sends name + phone or email (+ message) and sees a confirmation; invalid input shows field errors; the WhatsApp action is still there.
- The panel shows "Consultas" with the count of new leads; the inbox filters by status and type, newest first; a lead opens with tap-to-call, email and WhatsApp links, its property (if any), status and notes.
- Spam guard: more than 5 submissions per minute from one IP get a friendly "probá en un minuto"; a filled honeypot stores nothing.
- With SMTP configured a new lead emails `LEADS_NOTIFY_TO`; without it everything works and the API logs the lead.
- Checks pass in both repos: `npm test`, `npm run lint`, `npm run build`.

## Progress / evidence

### B1 — leads domain (strict TDD, Jest)

- `src/leads`: entity (`CHK_leads_contact`, FK `ON DELETE SET NULL`, index status+created_at), `CreateLeadDto` (phone-or-email via `ValidateIf`, inquiry requires `propertyId`, nested appraisal details, honeypot), admin filters/update DTOs, `LeadsService` (honeypot → `null` without saving, published-property check, list newest first with property summary, update with audit `lead.updated`, admin delete `lead.deleted`), public controller (5/min throttle, same `{ received: true }` either way), admin controller (admin+manager, delete admin-only). Migration `CreateLeads1790700000000`.
- Discovery: the local dev back runs with `DB_SYNCHRONIZE=true` and `nest start --watch`, so new migration files ran on the dev DB as soon as they were written, and synchronize then reshaped the table to the entity (dropped the CHECK, renamed the FK). The entity now declares the same constraint names as the migration, so dev and prod match.
- RED: DTO, service, controllers (missing modules). GREEN: 427 tests. Smoke test on the local back: 201, honeypot 201 with nothing stored, 400 (no contact / unknown property), 429 on the 6th request per minute; the test row was deleted afterwards. Lint/build OK.

### B2 — email notifications (strict TDD)

- `LEAD_NOTIFIER` port; `SmtpLeadNotifier` (nodemailer 10, bundled types; Node 22) when `SMTP_HOST/USER/PASS` + `LEADS_NOTIFY_TO` are set, else `LogLeadNotifier` (id + type only). Spanish plain-text email, Reply-To = visitor, panel link via `PUBLIC_SITE_URL`. Fire-and-forget after saving; failures only logged.
- Deploy: env example (optional SMTP block), compose `PUBLIC_SITE_URL: https://${SITE_DOMAIN}` for `api`, README section 9 (Google Workspace app password steps).
- RED: notifications spec (missing modules), service (notify assertions). GREEN: 434 tests. Lint/build OK.

### T1 — inquiry form + client (strict TDD)

- `src/lib/api/leads.ts` (submit + admin list/get/update/delete), `src/lib/leads/labels.ts` (enums, Spanish labels, `whatsappToLead` with AR mobile normalization), `src/lib/leads/inquiry-form.ts` (validation mirroring the DTO, API error mapping, form state).
- `sendInquiryAction` (bound to the property): 429 → "probá en un minuto", unpublished property, network → retry hint, API validation → fields.
- `PropertyInquiryForm` in the property aside: labelled name/phone/email/message (message prefilled), off-screen `aria-hidden` honeypot, WhatsApp button, pending state, thanks message (focused, `role="status"`), errors next to fields and kept values.
- RED: each module (missing), page wiring (1 failing). GREEN: 501 tests. Lint 0 errors. Build OK.

## Next step

T2.

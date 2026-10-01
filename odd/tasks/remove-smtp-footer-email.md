# Remove SMTP lead emails + show a contact email in the footer

**Objective:** drop the email notification service added in feature 8 and show a plain contact email on the public site.

**Why (user decision, 2026-10-01):** no mail service in the project. Leads keep arriving through the site form into the panel inbox ("Consultas") and are answered by WhatsApp (one-tap from the lead detail); visitors who prefer email write to a public address via a `mailto:` link.

## Scope

- **Back (`back-siricmanpropiedades`):**
  - Remove `src/leads/notifications/` (`LEAD_NOTIFIER` port, `SmtpLeadNotifier`, `LogLeadNotifier`, `lead-email.ts`, `lead-notifications.config.ts`, spec).
  - `LeadsService`: drop the notifier injection and `notifyInBackground`; `submit` just saves. Update `leads.service.spec.ts` (remove notifier provider and the two notifier tests).
  - `LeadsModule`: remove the `LEAD_NOTIFIER` factory provider and `ConfigModule` import if unused.
  - `npm uninstall nodemailer`.
  - Deploy: remove the SMTP block from `deploy/env.production.example`, `PUBLIC_SITE_URL` from the `api` service in `deploy/compose.yml` (only the email used it), and README section 9 → rewrite as a short "Consultas del sitio" section (leads stored in the panel, antispam 5/min + honeypot, no email).
- **Front (`front-siricmanpropiedades`):**
  - Footer: add the contact email as a `mailto:` link next to phone/Instagram (`src/components/layout/Footer/Footer.tsx`, test first). Put the address in one constant (e.g. `CONTACT_EMAIL` in `src/lib/contact.ts` or next to `WHATSAPP_PHONE`) so feature 9's Contacto page reuses it.
  - `odd/tasks/leads.md`: note B2 was reverted by this task.
  - `docs/ROADMAP.md`: the "Email notification on new leads" decision becomes "no — WhatsApp from the panel + public email (mailto)".
- Out: any change to the leads form, inbox or API contract.

## Pending input

- **Contact email address:** __TBD — ask the user if still blank__.

## Checks

Back: `npm test`, `npm run lint`, `npm run build`. Front: `npm test`, `npm run lint`, `npm run build`. Strict TDD for the footer change (RED first). One PR per repo, merged (autonomous delivery authorized).

## Next step

Start with the back removal, then the footer.

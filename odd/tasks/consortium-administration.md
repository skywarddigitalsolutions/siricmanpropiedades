# Feature 21: Administración de consorcios (public section)

Branch: `feat/consortium-administration` (not pushed). Status: **built, awaiting owner review before merge/publish**.

## Objective
Public page `/administracion-de-consorcios` presenting the consortium administration business, with a proposal form that creates a `contact` lead with topic `consortium`.

## Scope
- Route + metadata + canonical + sitemap entry.
- Sections: hero (CTA "Pedí una propuesta" + WhatsApp prefilled), Qué incluye (8), Cómo trabajamos (4 steps), Por qué elegirnos (4), FAQ (native `<details>`, 4), proposal form.
- Navigation: "Consorcios" in header (desktop + mobile menu), footer "Navegación", home service card now links to the page.
- Form: nombre, teléfono o email, dirección del edificio (required), unidades (optional), mensaje (optional), honeypot. The back DTO has no building fields for contact leads, so address and units are prepended to `message` ("Dirección del edificio: ...", "Unidades aproximadas: N"). Message capped at 1500 chars to stay under the API's 2000. No back changes.
- Out of scope: back changes, ROADMAP.md, publishing.

## Claims in the copy: OWNER MUST VERIFY
1. "+11 años administrando edificios en CABA" / "Más de 11 años administrando edificios en la Ciudad de Buenos Aires" (already used on home and Nosotros).
2. "Trato directo con Gabriel Siricman" / "Hablás con Gabriel Siricman, sin intermediarios ni call centers."
3. "Cuentas claras para cada propietario"; "Transparencia en las cuentas: cada gasto respaldado y explicado".
4. "Respuesta rápida a cada consulta"; "Consultas y reclamos atendidos a tiempo, por WhatsApp o por el canal que prefieras."
5. Qué incluye (each is a service claim): liquidación de expensas; cobranza y gestión de morosidad; pago a proveedores, servicios y personal; mantenimiento y reparaciones (relevamiento, presupuestos, coordinación); asambleas y actas (convocatoria, organización, registro); seguimiento de vencimientos de seguros y recarga de matafuegos; canal directo de atención a propietarios.
6. "Cumplimiento legal: gestión alineada con la Ley 941 y el Registro Público de Administradores de Consorcios de la Ciudad" (implies being registered; confirm registration and that wording is acceptable).
7. Cómo trabajamos: conversación inicial, propuesta con alcance y honorarios a medida, acompañamiento en asamblea y traspaso de documentación y cuentas, gestión mensual.
8. FAQ: cambio de administración se decide en asamblea y Siricman se ocupa del traspaso; honorarios "se cotizan según el edificio" (sin montos); documentación típica (reglamento, libros, liquidaciones, contratos, pólizas); traspaso sin plazos fijos.
9. Form confirmation: "Gabriel te contacta a la brevedad" (owner must actually answer these leads).
10. Hero WhatsApp uses the existing number (+54 9 11 3896-7363).
No invented figures beyond "+11 años".

## Tasks
- [x] T1 Form parser `src/lib/leads/consortium-form.ts` (+ tests)
- [x] T2 Server action `sendConsortiumAction` (+ tests)
- [x] T3 `ConsortiumForm` component (+ tests)
- [x] T4 Page, styles, metadata (+ tests)
- [x] T5 Nav (header/footer), home card link, sitemap (+ tests)
- [x] T6 Visual verification

Route: direct inline/single front writer (one delegated writer from the orchestrator). TDD: enabled, runner `vitest run`.

## Progress and evidence
- RED: after writing tests only, `npx vitest run`: 8 files failed (3 new test files unresolved imports + page; Header, Footer, seo-routes, HomeSections assertions), 5 tests failed.
- GREEN: after implementing, one test fixed (form test needed required fields typed before submit; jsdom blocks submit otherwise); lint warning cleaned.
- `npm run lint`: 0 errors (1 pre-existing warning in MfaEnrollment). `npm test`: 160 files / 1107 tests passed. `npm run build`: success, `/administracion-de-consorcios` static.
- Dev server on port 3300 rendered the page without API/env (static content).
- Screenshots (scratchpad): `f21-desktop-full.png`, `f21-desktop-top.png` (header nav), `f21-mobile-full.png`, `f21-mobile-menu.png`.

## Next step
Owner review of copy and design before merge. Not pushed.

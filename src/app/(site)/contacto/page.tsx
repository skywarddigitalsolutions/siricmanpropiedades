import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import ContactForm from "@/components/site/contact/ContactForm/ContactForm";
import MapEmbed from "@/components/site/MapEmbed/MapEmbed";
import WhatsAppIcon from "@/components/site/WhatsAppIcon/WhatsAppIcon";
import {
  CONTACT_EMAIL,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  OFFICE_ADDRESS,
  OFFICE_CITY,
  OFFICE_HOURS,
  OFFICE_MAP_QUERY,
  OFFICE_NEIGHBORHOOD,
  PHONE_DISPLAY,
  PHONE_HREF,
} from "@/lib/contact";
import { WHATSAPP_DEFAULT_MESSAGE, WHATSAPP_PHONE, buildWhatsAppLink } from "@/lib/whatsapp";
import { sendContactAction } from "./actions";
import styles from "./page.module.css";

const DESCRIPTION = `Escribinos por WhatsApp, email o Instagram, o visitanos en ${OFFICE_NEIGHBORHOOD} con cita previa. Te respondemos a la brevedad.`;

export const metadata: Metadata = {
  title: "Contacto",
  description: DESCRIPTION,
  alternates: { canonical: "/contacto" },
  openGraph: { type: "website", title: "Contacto", description: DESCRIPTION, url: "/contacto" },
};

type ContactOption = { key: string; label: string; value: string; href?: string; icon: ReactNode };

const OPTIONS: ContactOption[] = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    // The number is on the phone row; here, the action.
    value: "Escribinos ahora",
    href: buildWhatsAppLink(WHATSAPP_PHONE, WHATSAPP_DEFAULT_MESSAGE),
    icon: <WhatsAppIcon size={18} />,
  },
  { key: "phone", label: "Teléfono", value: PHONE_DISPLAY, href: PHONE_HREF, icon: <Phone size={18} /> },
  {
    key: "email",
    label: "Email",
    value: CONTACT_EMAIL,
    href: `mailto:${CONTACT_EMAIL}`,
    icon: <Mail size={18} />,
  },
  {
    key: "instagram",
    label: "Instagram",
    value: INSTAGRAM_HANDLE,
    href: INSTAGRAM_URL,
    // lucide ships no brand icons: the same outline glyph the page always used.
    icon: (
      <svg
        viewBox="0 0 24 24"
        width={18}
        height={18}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" />
      </svg>
    ),
  },
];

/** `/contacto` — contact channels, message form, office map and address. */
export default function ContactPage() {
  return (
    <main className={styles.main}>
      <section className={styles.page}>
        {/* The sticky side column stops at the end of this block, before the map. */}
        <div className={styles.split}>
          {/* Desktop: sticky side column (intro + contact). Phones: it dissolves into the flow. */}
          <div className={styles.side} data-side-column>
            <div className={styles.intro}>
              <span className={styles.eyebrow}>CONTACTO</span>
              <h1 className={styles.title}>Hablemos de tu propiedad</h1>
              <p className={styles.lead}>
                Escribinos por el medio que prefieras y te respondemos personalmente.
              </p>
            </div>

            <ul className={styles.contactList} aria-label="Contacto directo">
              {OPTIONS.map((option) => {
                const body = (
                  <>
                    <span className={styles.contactIcon} aria-hidden="true">
                      {option.icon}
                    </span>
                    <span className={styles.contactText}>
                      <span className={styles.contactLabel}>{option.label}</span>
                      <span className={styles.contactValue}>{option.value}</span>
                    </span>
                  </>
                );
                return (
                  <li key={option.key}>
                    {option.href ? (
                      <a
                        href={option.href}
                        className={`${styles.contactRow} ${styles.contactLink}`}
                        {...(option.href.startsWith("http")
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        {body}
                      </a>
                    ) : (
                      <div className={styles.contactRow}>{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className={styles.card}>
            <ContactForm action={sendContactAction} />
          </div>
        </div>

        <div className={styles.visit}>
          {/* No label over the map: the office block beside it has the address. */}
          <MapEmbed query={OFFICE_MAP_QUERY} title="Mapa de la oficina" />
          <section aria-labelledby="contact-office" className={`${styles.navy} ${styles.office}`}>
            <span className={styles.eyebrow}>Oficina</span>
            <h2 id="contact-office" className={styles.officeTitle}>
              {OFFICE_ADDRESS}
            </h2>
            <ul className={styles.officeList}>
              <li className={styles.officeItem}>
                <span className={styles.officeIcon} aria-hidden="true">
                  <MapPin size={18} />
                </span>
                {`${OFFICE_NEIGHBORHOOD}, ${OFFICE_CITY}`}
              </li>
              <li className={styles.officeItem}>
                <span className={styles.officeIcon} aria-hidden="true">
                  <Clock size={18} />
                </span>
                {`${OFFICE_HOURS} · con cita previa`}
              </li>
            </ul>
          </section>
        </div>
      </section>
    </main>
  );
}

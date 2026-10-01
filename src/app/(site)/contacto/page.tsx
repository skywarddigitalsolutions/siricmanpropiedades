import type { Metadata } from "next";
import type { ReactNode } from "react";
import ContactForm from "@/components/site/contact/ContactForm/ContactForm";
import MapEmbed from "@/components/site/MapEmbed/MapEmbed";
import WhatsAppIcon from "@/components/site/WhatsAppIcon/WhatsAppIcon";
import {
  CONTACT_EMAIL,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  OFFICE_ADDRESS,
  OFFICE_HOURS,
  OFFICE_MAP_QUERY,
  OFFICE_NEIGHBORHOOD,
  PHONE_DISPLAY,
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

type Tile = { key: string; label: string; value: string; href?: string; tone: string; icon: ReactNode };

const svg = (path: ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    width={20}
    height={20}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {path}
  </svg>
);

const TILES: Tile[] = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    value: PHONE_DISPLAY,
    href: buildWhatsAppLink(WHATSAPP_PHONE, WHATSAPP_DEFAULT_MESSAGE),
    tone: styles.toneWhatsapp,
    icon: <WhatsAppIcon size={20} />,
  },
  {
    key: "email",
    label: "Email",
    value: CONTACT_EMAIL,
    href: `mailto:${CONTACT_EMAIL}`,
    tone: styles.toneNavy,
    icon: svg(
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>,
    ),
  },
  {
    key: "instagram",
    label: "Instagram",
    value: INSTAGRAM_HANDLE,
    href: INSTAGRAM_URL,
    tone: styles.toneGold,
    icon: svg(
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" />
      </>,
    ),
  },
  {
    key: "hours",
    label: "Horario (con cita previa)",
    value: OFFICE_HOURS,
    tone: styles.toneNeutral,
    icon: svg(
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>,
    ),
  },
];

/** `/contacto` — contact channels, message form and office map. */
export default function ContactPage() {
  return (
    <main className={styles.main}>
      <section className={styles.page}>
        <div className={styles.intro}>
          <span className={styles.eyebrow}>CONTACTO</span>
          <h1 className={styles.title}>Hablemos de tu próxima operación</h1>
        </div>

        <ul className={styles.tiles}>
          {TILES.map((tile) => {
            const body = (
              <>
                <span className={`${styles.tileIcon} ${tile.tone}`}>{tile.icon}</span>
                <span className={styles.tileText}>
                  <span className={styles.tileLabel}>{tile.label}</span>
                  <span className={styles.tileValue}>{tile.value}</span>
                </span>
              </>
            );
            return (
              <li key={tile.key}>
                {tile.href ? (
                  <a
                    href={tile.href}
                    className={styles.tile}
                    {...(tile.href.startsWith("http")
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {body}
                  </a>
                ) : (
                  <div className={styles.tile}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>

        <div className={styles.columns}>
          <div className={styles.card}>
            <ContactForm action={sendContactAction} />
          </div>
          <MapEmbed
            query={OFFICE_MAP_QUERY}
            title="Mapa de la oficina"
            label={`${OFFICE_ADDRESS} · ${OFFICE_NEIGHBORHOOD}`}
          />
        </div>
      </section>
    </main>
  );
}

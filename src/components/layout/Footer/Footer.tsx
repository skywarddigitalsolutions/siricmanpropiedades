import Image from "next/image";
import Link from "next/link";
import {
  CONTACT_EMAIL,
  OFFICE_ADDRESS,
  OFFICE_CITY,
  OFFICE_HOURS,
  OFFICE_NEIGHBORHOOD,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  PHONE_DISPLAY,
  PHONE_HREF,
} from "@/lib/contact";
import { WHATSAPP_DEFAULT_MESSAGE, WHATSAPP_PHONE, buildWhatsAppLink } from "@/lib/whatsapp";
import styles from "./Footer.module.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Image
            src="/brand/logo-emblem.png"
            alt=""
            width={256}
            height={242}
            className={styles.logoImg}
          />
          <span className={styles.wordmark}>
            <span className={styles.brandName}>SIRICMAN</span>
            <span className={styles.brandSub}>PROPIEDADES</span>
          </span>
        </div>

        <div className={styles.address}>
          <span>
            {OFFICE_ADDRESS} · {OFFICE_NEIGHBORHOOD}, {OFFICE_CITY}
          </span>
          <span>{OFFICE_HOURS} · con cita previa</span>
          <ul className={styles.contactLinks}>
            <li>
              <a href={PHONE_HREF} className={styles.link}>
                {PHONE_DISPLAY}
              </a>
            </li>
            <li>
              <a
                href={buildWhatsAppLink(WHATSAPP_PHONE, WHATSAPP_DEFAULT_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                WhatsApp
              </a>
            </li>
            <li>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                {INSTAGRAM_HANDLE}
              </a>
            </li>
          </ul>
          <a href={`mailto:${CONTACT_EMAIL}`} className={styles.email}>
            {CONTACT_EMAIL}
          </a>
        </div>

        <div className={styles.professional}>
          <span>Gabriel Siricman · Martillero Público y Corredor Inmobiliario</span>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <span>© {year} Siricman Propiedades</span>
        <nav aria-label="Legales" className={styles.legal}>
          <Link href="/terminos">Términos y condiciones</Link>
          <Link href="/privacidad">Privacidad</Link>
        </nav>
      </div>
    </footer>
  );
}

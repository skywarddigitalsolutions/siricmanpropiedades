import Image from "next/image";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import {
  BROKER_LICENSE,
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
import WhatsAppIcon from "@/components/site/WhatsAppIcon/WhatsAppIcon";
import styles from "./Footer.module.css";

const NAV_LINKS = [
  { label: "Comprar", href: "/propiedades?operacion=venta" },
  { label: "Alquilar", href: "/propiedades?operacion=alquiler" },
  { label: "Tasaciones", href: "/tasaciones" },
  { label: "Consorcios", href: "/administracion-de-consorcios" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Contacto", href: "/contacto" },
];

/** Instagram glyph (lucide-react no longer ships brand icons). */
function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  const whatsappHref = buildWhatsAppLink(WHATSAPP_PHONE, WHATSAPP_DEFAULT_MESSAGE);

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandColumn}>
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
          <p className={styles.tagline}>
            Venta y alquiler en CABA con asesoramiento personal, de principio a fin.
          </p>
          <p className={styles.professional}>
            Gabriel Siricman · Martillero Público y Corredor Inmobiliario
            <span className={styles.license}>{BROKER_LICENSE}</span>
          </p>
          <div className={styles.social}>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className={styles.socialButton}
            >
              <InstagramIcon size={20} />
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className={styles.socialButton}
            >
              <WhatsAppIcon size={20} />
            </a>
          </div>
        </div>

        <div className={styles.column}>
          <h2 className={styles.heading}>Contacto</h2>
          <ul className={styles.list}>
            <li className={styles.item}>
              <MapPin aria-hidden size={18} className={styles.itemIcon} />
              <span>
                {OFFICE_ADDRESS} · {OFFICE_NEIGHBORHOOD}, {OFFICE_CITY}
              </span>
            </li>
            <li className={styles.item}>
              <Clock aria-hidden size={18} className={styles.itemIcon} />
              <span>{OFFICE_HOURS} · con cita previa</span>
            </li>
            <li className={styles.item}>
              <Phone aria-hidden size={18} className={styles.itemIcon} />
              <a href={PHONE_HREF} className={styles.link}>
                {PHONE_DISPLAY}
              </a>
            </li>
            <li className={styles.item}>
              <WhatsAppIcon size={18} className={styles.itemIcon} />
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                Escribinos por WhatsApp
              </a>
            </li>
            <li className={styles.item}>
              <Mail aria-hidden size={18} className={styles.itemIcon} />
              <a href={`mailto:${CONTACT_EMAIL}`} className={`${styles.link} ${styles.email}`}>
                {CONTACT_EMAIL}
              </a>
            </li>
            <li className={styles.item}>
              <InstagramIcon size={18} />
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
        </div>

        <nav aria-label="Navegación del sitio" className={styles.column}>
          <h2 className={styles.heading}>Navegación</h2>
          <ul className={styles.list}>
            {NAV_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={styles.link}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className={styles.bottomBar}>
        <span>
          © {year} Siricman Propiedades · Sitio desarrollado por Skyward Digital Solutions
        </span>
        <nav aria-label="Legales" className={styles.legal}>
          <Link href="/terminos">Términos y condiciones</Link>
          <Link href="/privacidad">Privacidad</Link>
        </nav>
      </div>
    </footer>
  );
}

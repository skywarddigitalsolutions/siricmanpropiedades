import Link from "next/link";
import { ArrowRight, Building2, ChartLine, Handshake, House, KeyRound, Megaphone } from "lucide-react";
import { PROPERTY_TYPES, type PropertyType } from "@/lib/properties/enums";
import { EMPTY_SEARCH, buildSearchHref } from "@/lib/public/search-params";
import { WHATSAPP_PHONE, buildWhatsAppLink } from "@/lib/whatsapp";
import WhatsAppIcon from "../../WhatsAppIcon/WhatsAppIcon";
import styles from "./HomeSections.module.css";

const CTA_BENEFITS = [
  { icon: ChartLine, text: "Tasación profesional" },
  { icon: Megaphone, text: "Estrategia de publicación" },
  { icon: Handshake, text: "Te acompañamos en todo el proceso" },
];

const CTA_WHATSAPP_MESSAGE = "Hola! Quiero tasar mi propiedad.";

const TYPE_CHIP_LABELS: Record<PropertyType, string> = {
  apartment: "Departamentos",
  house: "Casas",
  ph: "PH",
  land: "Terrenos",
  commercial: "Locales",
  office: "Oficinas",
  garage: "Cocheras",
};

/** Horizontally scrollable shortcuts to results by property type. */
export function TypeChips() {
  return (
    <nav aria-label="Tipos de propiedad" className={styles.chipsSection}>
      <ul className={styles.chips}>
        {PROPERTY_TYPES.map((type) => (
          <li key={type}>
            <Link href={buildSearchHref(EMPTY_SEARCH, { type })} className={styles.chip}>
              {TYPE_CHIP_LABELS[type]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const SERVICES = [
  {
    icon: KeyRound,
    title: "Comprar",
    text: "Te acompañamos en la búsqueda, la negociación y la escritura.",
    href: buildSearchHref(EMPTY_SEARCH, { operation: "sale" }),
  },
  {
    icon: House,
    title: "Alquilar",
    text: "Contratos claros y gestión ordenada, para inquilinos y propietarios.",
    href: buildSearchHref(EMPTY_SEARCH, { operation: "rent" }),
  },
  {
    icon: ChartLine,
    title: "Vender o tasar",
    text: "Tasación profesional y estrategia de publicación.",
    href: "/tasaciones",
  },
  {
    icon: Building2,
    title: "Consorcios",
    text: "Más de 11 años administrando edificios en CABA.",
    href: "/administracion-de-consorcios",
  },
];

export function ServicesGrid() {
  return (
    <section aria-label="Servicios" className={styles.section}>
      <ul className={styles.services}>
        {SERVICES.map(({ icon: Icon, title, text, href }) => (
          <li key={title}>
            <Link href={href} className={styles.service}>
              <span className={styles.serviceIcon}>
                <Icon aria-hidden size={22} />
              </span>
              <span className={styles.serviceText}>
                <span className={styles.serviceTitle}>{title}</span>
                <span className={styles.serviceBody}>{text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AppraisalCta() {
  return (
    <section aria-labelledby="home-cta-title" className={`${styles.section} ${styles.last}`}>
      <div className={styles.cta}>
        <div className={styles.ctaText}>
          <p className={styles.ctaEyebrow}>Tasaciones</p>
          <h2 id="home-cta-title" className={styles.ctaTitle}>
            ¿Querés vender o alquilar?
          </h2>
          <p className={styles.ctaBody}>
            Pedí una tasación profesional y te armamos la estrategia de publicación.
          </p>
        </div>

        <div className={styles.ctaSide}>
          <ul className={styles.ctaBenefits}>
            {CTA_BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text} className={styles.ctaBenefit}>
                <span className={styles.ctaBenefitIcon}>
                  <Icon aria-hidden size={18} />
                </span>
                {text}
              </li>
            ))}
          </ul>
          <div className={styles.ctaActions}>
            <Link href="/tasaciones" className={styles.ctaButton}>
              Solicitar tasación
              <ArrowRight aria-hidden size={18} />
            </Link>
            <a
              href={buildWhatsAppLink(WHATSAPP_PHONE, CTA_WHATSAPP_MESSAGE)}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaSecondary}
            >
              <WhatsAppIcon size={18} />
              Escribinos por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

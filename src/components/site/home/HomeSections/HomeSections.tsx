import Link from "next/link";
import { Building2, ChartLine, House, KeyRound } from "lucide-react";
import { PROPERTY_TYPES, type PropertyType } from "@/lib/properties/enums";
import { EMPTY_SEARCH, buildSearchHref } from "@/lib/public/search-params";
import styles from "./HomeSections.module.css";

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
      {/* Edge fades hint that the row scrolls. */}
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
    href: "/contacto",
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
          <h2 id="home-cta-title" className={styles.ctaTitle}>
            ¿Querés vender o alquilar?
          </h2>
          <p className={styles.ctaBody}>
            Pedí una tasación profesional y te armamos la estrategia de publicación.
          </p>
        </div>
        <Link href="/tasaciones" className={styles.ctaButton}>
          Solicitar tasación
        </Link>
      </div>
    </section>
  );
}

import Link from "next/link";
import { ArrowRight, Building2, ChartLine, House, KeyRound } from "lucide-react";
import { PROPERTY_TYPES, type PropertyType } from "@/lib/properties/enums";
import { EMPTY_SEARCH, buildSearchHref } from "@/lib/public/search-params";
import type { PublicPropertyListItem } from "@/lib/public/types";
import PropertyCard from "../../PropertyCard/PropertyCard";
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

type PropertyCarouselProps = {
  title: string;
  properties: PublicPropertyListItem[];
};

/** Scroll-snap row of cards with a "Ver todas" link to the full results. */
export function PropertyCarousel({ title, properties }: PropertyCarouselProps) {
  return (
    <section aria-labelledby="home-carousel-title" className={styles.carouselSection}>
      <div className={styles.carouselHeader}>
        <h2 id="home-carousel-title" className={styles.sectionTitle}>
          {title}
        </h2>
        <Link href="/propiedades" className={styles.seeAll}>
          Ver todas
          <ArrowRight aria-hidden size={16} />
        </Link>
      </div>
      <ul className={styles.carousel}>
        {properties.map((property) => (
          <li key={property.id} className={styles.slide}>
            <PropertyCard property={property} sizes="(min-width: 640px) 360px, 82vw" />
          </li>
        ))}
      </ul>
    </section>
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

export function PersonalQuote() {
  return (
    <section aria-label="Atención personal" className={styles.section}>
      <figure className={styles.quoteCard}>
        <div className={styles.portrait} aria-hidden>
          <span className={styles.monogram}>GS</span>
        </div>
        <div className={styles.quoteBody}>
          <span className={styles.eyebrow}>Atención personal</span>
          <blockquote className={styles.quote}>
            <p>
              “Quiero que cada cliente se sienta cuidado y asesorado de principio a
              fin. Por eso me encargo personalmente de cada operación.”
            </p>
          </blockquote>
          <figcaption className={styles.author}>
            <span className={styles.authorName}>Gabriel Siricman</span>
            <span className={styles.authorRole}>
              Martillero Público y Corredor Inmobiliario
            </span>
          </figcaption>
          <ul className={styles.pills}>
            <li className={styles.pill}>+11 años en CABA</li>
            <li className={styles.pill}>Un solo interlocutor</li>
          </ul>
        </div>
      </figure>
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

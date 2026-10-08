import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Car,
  DoorOpen,
  House,
  Store,
  Trees,
  type LucideIcon,
} from "lucide-react";
import { PROPERTY_TYPES, type PropertyType } from "@/lib/properties/enums";
import { EMPTY_SEARCH, RESULTS_PATH, buildSearchHref } from "@/lib/public/search-params";
import styles from "./BuyerSearch.module.css";

// Provisional copy: edit here.
const EYEBROW = "PARA QUIENES BUSCAN";
const TITLE = "¿Buscás comprar o alquilar?";
const TYPES_TITLE = "¿Qué tipo de propiedad?";
const ALL_LABEL = "Ver todas las propiedades";

const TITLE_ID = "buyer-search-title";
const TYPES_TITLE_ID = "buyer-search-types-title";

// Provisional photos (replace with the agency's own photography when available):
// - /home/buy.jpg: https://www.pexels.com/photo/beige-concrete-building-under-blue-sky-10836958/
//   by Samuel Gutierrez, Pexels License (free). Buenos Aires facade, 1200x1800.
// - /home/rent.jpg: https://unsplash.com/photos/AgK_XAqSbfk by Danilo Rios,
//   Unsplash License (free, not Unsplash+), 1600x1067.
const OPERATION_CARDS = [
  {
    title: "Comprar",
    subtitle: "Propiedades en venta",
    href: buildSearchHref(EMPTY_SEARCH, { operation: "sale" }),
    photo: "/home/buy.jpg",
    photoClass: "photoBuy",
  },
  {
    title: "Alquilar",
    subtitle: "Propiedades en alquiler",
    href: buildSearchHref(EMPTY_SEARCH, { operation: "rent" }),
    photo: "/home/rent.jpg",
    photoClass: "photoRent",
  },
] as const;

const TYPE_LABELS: Record<PropertyType, string> = {
  apartment: "Departamentos",
  house: "Casas",
  ph: "PH",
  land: "Terrenos",
  commercial: "Locales",
  office: "Oficinas",
  garage: "Cocheras",
};

const TYPE_ICONS: Record<PropertyType, LucideIcon> = {
  apartment: Building2,
  house: House,
  ph: DoorOpen,
  land: Trees,
  commercial: Store,
  office: Briefcase,
  garage: Car,
};

/**
 * Home section for buyers and tenants: two photo cards into sale and rental
 * listings, shortcuts by property type and a link to every listing. Server
 * component.
 *
 * DOM order (intro, cards, types, "see all") is the mobile reading order;
 * from 960px a grid puts "see all" to the right of the intro.
 */
export default function BuyerSearch() {
  return (
    <section className={styles.section} aria-labelledby={TITLE_ID}>
      <div className={styles.inner}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>{EYEBROW}</p>
          <h2 id={TITLE_ID} className={styles.title}>
            {TITLE}
          </h2>
        </div>

        <ul className={styles.cards}>
          {OPERATION_CARDS.map((card) => (
            <li key={card.title}>
              <Link href={card.href} className={styles.card}>
                <Image
                  src={card.photo}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className={`${styles.photo} ${styles[card.photoClass]}`}
                />
                <span className={styles.label}>
                  <span className={styles.labelText}>
                    <span className={styles.labelTitle}>{card.title}</span>
                    {/* Separates title and subtitle in the link's accessible name. */}
                    <span className="sr-only">, </span>
                    <span className={styles.labelSubtitle}>{card.subtitle}</span>
                  </span>
                  <span className={styles.labelArrow}>
                    <ArrowRight size={18} aria-hidden />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.types}>
          <h3 id={TYPES_TITLE_ID} className={styles.typesTitle}>
            {TYPES_TITLE}
          </h3>
          <ul className={styles.typeList} aria-labelledby={TYPES_TITLE_ID}>
            {PROPERTY_TYPES.map((type) => {
              const Icon = TYPE_ICONS[type];
              return (
                <li key={type}>
                  <Link href={buildSearchHref(EMPTY_SEARCH, { type })} className={styles.type}>
                    <span className={styles.typeIcon}>
                      <Icon size={18} aria-hidden />
                    </span>
                    <span className={styles.typeLabel}>{TYPE_LABELS[type]}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <Link href={RESULTS_PATH} className={styles.all}>
          {ALL_LABEL}
          <ArrowRight size={18} aria-hidden />
        </Link>
      </div>
    </section>
  );
}

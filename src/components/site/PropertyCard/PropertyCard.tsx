import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { OPERATION_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/properties/labels";
import {
  dealStatusNotice,
  displayTitle,
  expensesLabel,
  propertyPriceLabel,
  propertySpecs,
  tagLabel,
} from "@/lib/public/property-view";
import type { PublicPropertyListItem } from "@/lib/public/types";
import PropertyIcon from "../PropertyIcon/PropertyIcon";
import styles from "./PropertyCard.module.css";

type PropertyCardProps = {
  property: PublicPropertyListItem;
  /** Heading level for the title, so cards fit the page outline. */
  headingLevel?: 2 | 3;
  /** Responsive `sizes` hint for the cover image. */
  sizes?: string;
};

/**
 * Listing card (home carousel and results grid). The title link is stretched
 * over the whole card, so the card is one tap target with one link name.
 */
export default function PropertyCard({
  property,
  headingLevel = 3,
  sizes = "(min-width: 960px) 360px, (min-width: 640px) 50vw, 100vw",
}: PropertyCardProps) {
  const Heading = `h${headingLevel}` as const;
  const status = dealStatusNotice(property);
  const tag = tagLabel(property);
  const expenses = expensesLabel(property);

  return (
    <article className={styles.card} data-unavailable={status && !status.available ? "" : undefined}>
      <div className={styles.media}>
        {property.coverImage ? (
          <Image
            src={property.coverImage}
            alt={displayTitle(property.title)}
            fill
            sizes={sizes}
            className={styles.photo}
            unoptimized
          />
        ) : (
          <span className={styles.noPhoto}>Sin fotos</span>
        )}
        <div className={styles.badges}>
          <span className={styles.badge}>{OPERATION_LABELS[property.operation]}</span>
          {tag && <span className={`${styles.badge} ${styles.tag}`}>{tag}</span>}
        </div>
      </div>

      {status && (
        <p className={styles.status} data-tone={status.tone}>
          {status.label}
        </p>
      )}

      <div className={styles.body}>
        <span className={styles.price}>{propertyPriceLabel(property)}</span>
        {expenses && <span className={styles.expenses}>{expenses}</span>}
        <Heading className={styles.title}>
          <Link href={`/propiedades/${property.slug}`} className={styles.link}>
            {displayTitle(property.title)}
          </Link>
        </Heading>
        <span className={styles.location}>
          <MapPin aria-hidden size={14} className={styles.pin} />
          {PROPERTY_TYPE_LABELS[property.type]} · {property.neighborhood.name}
        </span>
        <ul className={styles.specs}>
          {propertySpecs(property).map((spec) => (
            <li key={spec.icon} className={styles.spec}>
              <PropertyIcon name={spec.icon} size={16} className={styles.specIcon} />
              <span aria-hidden>{spec.text}</span>
              <span className="sr-only">{spec.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

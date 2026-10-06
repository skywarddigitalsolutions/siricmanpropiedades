import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Operation } from "@/lib/properties/enums";
import { EMPTY_SEARCH, buildSearchHref } from "@/lib/public/search-params";
import type { PublicPropertyListItem } from "@/lib/public/types";
import FeaturedTrack from "./FeaturedTrack";
import styles from "./FeaturedSection.module.css";

type FeaturedSectionProps = {
  operation: Operation;
  /** Small gold label above the title. */
  eyebrow: string;
  title: string;
  subtitle: string;
  properties: PublicPropertyListItem[];
};

/** Home block for one operation: header with a "Ver todas" link and the card carousel. */
export default function FeaturedSection({
  operation,
  eyebrow,
  title,
  subtitle,
  properties,
}: FeaturedSectionProps) {
  if (properties.length === 0) return null;
  const titleId = `featured-${operation}-title`;

  return (
    <section aria-labelledby={titleId} className={styles.section}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <Link href={buildSearchHref(EMPTY_SEARCH, { operation })} className={styles.seeAll}>
          Ver todas
          <ArrowRight aria-hidden size={18} className={styles.seeAllIcon} />
        </Link>
      </header>
      <FeaturedTrack properties={properties} />
    </section>
  );
}

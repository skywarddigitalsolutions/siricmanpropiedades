import Link from "next/link";
import type { PublicationCounts } from "@/lib/api/properties";
import type { PublicationStatus } from "@/lib/properties/enums";
import {
  buildPropertyListHref,
  type PropertyListFilters,
} from "@/lib/properties/list-params";
import styles from "./PropertyStatusTabs.module.css";

type PropertyStatusTabsProps = {
  filters: PropertyListFilters;
  counts: PublicationCounts;
};

const TABS: { status: PublicationStatus | undefined; label: string }[] = [
  { status: undefined, label: "Todas" },
  { status: "published", label: "Publicadas" },
  { status: "draft", label: "Borradores" },
  { status: "archived", label: "Archivadas" },
];

/** One-tap status chips with counts; every other filter is preserved. */
export default function PropertyStatusTabs({
  filters,
  counts,
}: PropertyStatusTabsProps) {
  const total = counts.draft + counts.published + counts.archived;

  return (
    <nav aria-label="Estado de publicación" className={styles.tabs}>
      {TABS.map(({ status, label }) => {
        const active = filters.publicationStatus === status;
        const count = status ? counts[status] : total;
        const next: PropertyListFilters = { ...filters };
        if (status) next.publicationStatus = status;
        else delete next.publicationStatus;
        return (
          <Link
            key={label}
            href={buildPropertyListHref(next, 1)}
            className={styles.tab}
            aria-current={active ? "page" : undefined}
          >
            {label} <span className={styles.count}>{count}</span>
          </Link>
        );
      })}
    </nav>
  );
}

import Link from "next/link";
import type { LeadCounts } from "@/lib/api/leads";
import {
  buildInboxHref,
  type InboxState,
  type InboxStatus,
} from "@/lib/leads/inbox-params";
import { LEAD_CATEGORIES, LEAD_CATEGORY_LABELS, type LeadCategory } from "@/lib/leads/category";
import { LEAD_CATEGORY_ICONS } from "../LeadCategoryTag/LeadCategoryTag";
import styles from "./InboxFilters.module.css";

const STATUS_TABS: { label: string; status: InboxStatus }[] = [
  { label: "Todas", status: "all" },
  { label: "Nuevas", status: "new" },
  { label: "Contactadas", status: "contacted" },
  { label: "Cerradas", status: "closed" },
];

function tabCount(status: InboxStatus, counts: LeadCounts): number {
  return status === "all" ? counts.new + counts.contacted + counts.closed : counts[status];
}

/**
 * Status tabs (with a count pill when the API sent counts) and category chips;
 * plain links, so the URL keeps the inbox state, search included.
 */
export default function InboxFilters({
  state,
  counts,
}: {
  state: InboxState;
  counts?: LeadCounts;
}) {
  return (
    <div className={styles.filters}>
      <nav aria-label="Estado" className={styles.tabs}>
        {STATUS_TABS.map(({ label, status }) => (
          <Link
            key={status}
            href={buildInboxHref(state, { status })}
            aria-current={state.status === status ? "page" : undefined}
            className={styles.tab}
          >
            {label}
            {counts && <span className={styles.pill}>{tabCount(status, counts)}</span>}
          </Link>
        ))}
      </nav>
      <nav aria-label="Categoría" className={styles.chips}>
        <Link
          href={buildInboxHref(state, { category: undefined })}
          aria-current={state.category === undefined ? "page" : undefined}
          className={styles.chip}
        >
          Todas
        </Link>
        {LEAD_CATEGORIES.map((category: LeadCategory) => {
          const Icon = LEAD_CATEGORY_ICONS[category];
          return (
            <Link
              key={category}
              href={buildInboxHref(state, { category })}
              aria-current={state.category === category ? "page" : undefined}
              className={styles.chip}
              data-category={category}
            >
              <Icon aria-hidden size={15} />
              {LEAD_CATEGORY_LABELS[category]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

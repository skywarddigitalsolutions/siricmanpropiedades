import type { PublicationStatus } from "@/lib/properties/enums";
import { PUBLICATION_STATUS_LABELS } from "@/lib/properties/labels";
import styles from "./PublicationStatusBadge.module.css";

type PublicationStatusBadgeProps = {
  status: PublicationStatus;
};

const VARIANT_BY_STATUS: Record<PublicationStatus, string> = {
  draft: styles.draft,
  published: styles.published,
  archived: styles.archived,
};

/** Accessible publication-status pill — the label text itself conveys the status, not color alone. */
export default function PublicationStatusBadge({
  status,
}: PublicationStatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${VARIANT_BY_STATUS[status]}`}>
      {PUBLICATION_STATUS_LABELS[status]}
    </span>
  );
}

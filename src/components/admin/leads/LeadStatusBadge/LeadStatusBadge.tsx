import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/leads/labels";
import styles from "./LeadStatusBadge.module.css";

/** Lead status pill; the text carries the meaning, color only reinforces it. */
export default function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={styles.badge} data-status={status}>
      {LEAD_STATUS_LABELS[status]}
    </span>
  );
}

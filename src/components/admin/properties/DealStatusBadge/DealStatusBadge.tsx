import type { DealStatus } from "@/lib/properties/enums";
import { DEAL_STATUS_LABELS } from "@/lib/properties/labels";
import styles from "./DealStatusBadge.module.css";

type DealStatusBadgeProps = {
  status: DealStatus;
};

const VARIANT_BY_STATUS: Record<DealStatus, string> = {
  available: styles.available,
  reserved: styles.accent,
  sold: styles.accent,
  rented: styles.accent,
};

/** Accessible deal-status pill — reserved/sold/rented get the gold accent; available stays neutral. */
export default function DealStatusBadge({ status }: DealStatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${VARIANT_BY_STATUS[status]}`}>
      {DEAL_STATUS_LABELS[status]}
    </span>
  );
}

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { Tone } from "@/components/admin/ui/StatusBadge/StatusBadge";
import styles from "./KpiCard.module.css";

type KpiCardProps = {
  href: string;
  label: string;
  value: number;
  icon: LucideIcon;
  tone: Tone;
  /** `large` stands out for the headline numbers; `compact` is a slim one-line card. */
  size?: "default" | "large" | "compact";
};

/** One dashboard number: label with a tinted icon, the count, and a link to the matching list. */
export default function KpiCard({ href, label, value, icon: Icon, tone, size = "default" }: KpiCardProps) {
  return (
    <Link href={href} className={styles.card} data-size={size}>
      <span className={styles.top}>
        <span className={styles.label}>{label}</span>
        <span className={styles.icon} data-tone={tone}>
          <Icon aria-hidden size={20} />
        </span>
      </span>{" "}
      <span className={styles.value}>{value}</span>
    </Link>
  );
}

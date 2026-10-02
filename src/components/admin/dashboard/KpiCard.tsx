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
};

/** One dashboard number: label with a tinted icon, the count, and a link to the matching list. */
export default function KpiCard({ href, label, value, icon: Icon, tone }: KpiCardProps) {
  return (
    <Link href={href} className={styles.card}>
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

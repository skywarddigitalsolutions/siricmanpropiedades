import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import styles from "./EmptyState.module.css";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Call to action (usually a `ButtonLink`). */
  children?: ReactNode;
};

/** Friendly empty list: a soft icon, what is missing and what to do next. */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <span className={styles.iconWrap}>
        <Icon aria-hidden size={26} />
      </span>
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {children && <div className={styles.action}>{children}</div>}
    </div>
  );
}

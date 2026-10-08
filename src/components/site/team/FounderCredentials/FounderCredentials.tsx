import { founderHighlights, type FounderVariant } from "@/lib/public/team";
import styles from "./FounderCredentials.module.css";

interface FounderCredentialsProps {
  /** `consortium` swaps the broker role and license for the consortium registration. */
  variant?: FounderVariant;
}

/**
 * Gabriel's credentials, short and identical wherever he is presented: the
 * role on one line, then small gold-tint pills (license, teaching, years).
 * Server component.
 */
export default function FounderCredentials({ variant = "broker" }: FounderCredentialsProps) {
  const [role, ...items] = founderHighlights(variant);
  // Pills never carry a separator: wrapping stays clean at any width.

  return (
    <div className={styles.root}>
      <p className={styles.role}>{role}</p>
      <p className={styles.items}>
        {items.map((item) => (
          <span key={item} className={styles.item}>
            {item}
          </span>
        ))}
      </p>
    </div>
  );
}

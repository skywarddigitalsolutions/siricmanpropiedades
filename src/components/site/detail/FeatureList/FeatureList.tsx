import type { LucideIcon } from "lucide-react";
import styles from "./FeatureList.module.css";

type FeatureListProps = {
  items: { key: string; label: string; Icon: LucideIcon }[];
};

/** Two-column list of features, each with its icon in a gold-bordered tile. */
export default function FeatureList({ items }: FeatureListProps) {
  return (
    <ul className={styles.list}>
      {items.map(({ key, label, Icon }) => (
        <li key={key} className={styles.item}>
          <span className={styles.icon}>
            <Icon aria-hidden size={18} />
          </span>
          {label}
        </li>
      ))}
    </ul>
  );
}

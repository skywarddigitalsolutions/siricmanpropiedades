import type { ReactNode } from "react";
import styles from "./AuthHeading.module.css";

/** Title block shared by every auth screen. */
export default function AuthHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className={styles.heading}>
      <h1 className={styles.title}>{title}</h1>
      {children && <p className={styles.subtitle}>{children}</p>}
    </div>
  );
}

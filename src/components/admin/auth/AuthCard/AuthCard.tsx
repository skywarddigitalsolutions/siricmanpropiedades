import type { ReactNode } from "react";
import styles from "./AuthCard.module.css";

type AuthCardProps = {
  children: ReactNode;
};

/** Presentational centered-card shell shared by every `/admin/(auth)` screen (ADR-7). */
export default function AuthCard({ children }: AuthCardProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>{children}</div>
    </div>
  );
}

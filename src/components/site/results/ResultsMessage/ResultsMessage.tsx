import type { ReactNode } from "react";
import styles from "./ResultsMessage.module.css";

type ResultsMessageProps = {
  title: string;
  children?: ReactNode;
  /** Links or buttons offered as the next step. */
  actions?: ReactNode;
};

/** Centered card for empty, not-found and unavailable results. */
export default function ResultsMessage({ title, children, actions }: ResultsMessageProps) {
  return (
    <div className={styles.message}>
      <p className={styles.title}>{title}</p>
      {children && <p className={styles.text}>{children}</p>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}

import type { ReactNode } from "react";
import styles from "./ResultsMessage.module.css";

type ResultsMessageProps = {
  title: string;
  children?: ReactNode;
  /** Links or buttons offered as the next step. */
  actions?: ReactNode;
  /** Element for the title: `h1` when the message is the whole page. */
  titleAs?: "p" | "h1";
};

/** Centered card for empty, not-found and unavailable states. */
export default function ResultsMessage({
  title,
  children,
  actions,
  titleAs: Title = "p",
}: ResultsMessageProps) {
  return (
    <div className={styles.message}>
      <Title className={styles.title}>{title}</Title>
      {children && <p className={styles.text}>{children}</p>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}

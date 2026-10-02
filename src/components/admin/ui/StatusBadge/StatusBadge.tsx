import type { ReactNode } from "react";
import styles from "./StatusBadge.module.css";

export type Tone = "success" | "warning" | "neutral" | "info" | "danger";

type StatusBadgeProps = {
  tone: Tone;
  children: ReactNode;
};

/**
 * Semantic status pill shared by properties, deals and leads. The text carries
 * the meaning; the tone (soft background + strong text) only reinforces it.
 */
export default function StatusBadge({ tone, children }: StatusBadgeProps) {
  return (
    <span className={styles.badge} data-tone={tone}>
      {children}
    </span>
  );
}

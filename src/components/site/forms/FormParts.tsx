import type { ReactNode } from "react";
import styles from "./FormParts.module.css";

/** Visible "(opcional)" tail for a label; it is part of the label's accessible name. */
export function Optional() {
  return <span className={styles.optional}> (opcional)</span>;
}

/** Help text under a label; connect it to the input with `aria-describedby`. */
export function FormHint({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className={styles.hint}>
      {children}
    </p>
  );
}

/**
 * Polite live region kept outside the form (which remounts after an error),
 * so screen readers announce how many fields need attention.
 */
export function FormLiveRegion({ fieldErrors }: { fieldErrors: number }) {
  return (
    <p aria-live="polite" className="sr-only">
      {fieldErrors > 0
        ? `Hay ${fieldErrors} ${fieldErrors === 1 ? "campo" : "campos"} para revisar.`
        : ""}
    </p>
  );
}

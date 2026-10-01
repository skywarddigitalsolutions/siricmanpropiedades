import type { InputHTMLAttributes } from "react";
import styles from "./CheckboxField.module.css";

type CheckboxFieldProps = {
  id: string;
  name: string;
  label: string;
  error?: string;
  hint?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "name" | "type">;

/**
 * Checkbox with the label beside the box and a large (>=44px) tap area,
 * wiring `aria-invalid`/`aria-describedby` from `error` (matches TextField,
 * ADR-8).
 */
export default function CheckboxField({
  id,
  name,
  label,
  error,
  hint,
  ...inputProps
}: CheckboxFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.option}>
        <input
          id={id}
          name={name}
          type="checkbox"
          className={styles.checkbox}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...inputProps}
        />
        <span className={styles.labelText}>{label}</span>
      </label>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

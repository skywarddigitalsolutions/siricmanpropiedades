import type { TextareaHTMLAttributes } from "react";
import styles from "./TextareaField.module.css";

type TextareaFieldProps = {
  id: string;
  name: string;
  label: string;
  error?: string;
  hint?: string;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "name">;

/** Labeled textarea wiring `aria-invalid`/`aria-describedby` from `error` (matches TextField, ADR-8). */
export default function TextareaField({
  id,
  name,
  label,
  error,
  hint,
  rows = 4,
  ...textareaProps
}: TextareaFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        className={styles.textarea}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...textareaProps}
      />
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

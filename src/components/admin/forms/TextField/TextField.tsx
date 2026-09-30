import type { InputHTMLAttributes } from "react";
import styles from "./TextField.module.css";

type TextFieldProps = {
  id: string;
  name: string;
  label: string;
  error?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "name">;

/** Labeled input wiring `aria-invalid`/`aria-describedby` from `error` (ADR-8). */
export default function TextField({
  id,
  name,
  label,
  error,
  type = "text",
  ...inputProps
}: TextFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        className={styles.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

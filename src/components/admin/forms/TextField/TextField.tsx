import type { InputHTMLAttributes, Ref } from "react";
import styles from "./TextField.module.css";

type TextFieldProps = {
  id: string;
  name: string;
  label: string;
  error?: string;
  /** Extra class merged after the base input class (for one-off sizing). */
  inputClassName?: string;
  /** React 19 passes `ref` as a regular prop. */
  ref?: Ref<HTMLInputElement>;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "name">;

/** Labeled input wiring `aria-invalid`/`aria-describedby` from `error` (ADR-8). */
export default function TextField({
  id,
  name,
  label,
  error,
  inputClassName,
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
        className={inputClassName ? `${styles.input} ${inputClassName}` : styles.input}
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

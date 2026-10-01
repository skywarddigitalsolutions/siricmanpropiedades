import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import styles from "./TextField.module.css";

type TextFieldProps = {
  id: string;
  name: string;
  label: string;
  error?: string;
  /** Extra class merged after the base input class (for one-off sizing). */
  inputClassName?: string;
  /** Decorative leading icon (rendered `aria-hidden` by the caller). */
  icon?: ReactNode;
  /** Leading text inside the control (e.g. a currency symbol). */
  adornment?: string;
  /** Interactive trailing control (e.g. a show/hide button). */
  trailing?: ReactNode;
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
  icon,
  trailing,
  adornment,
  type = "text",
  ...inputProps
}: TextFieldProps) {
  const errorId = `${id}-error`;
  const classes = [
    styles.input,
    icon && styles.withIcon,
    adornment && styles.withAdornment,
    trailing && styles.withTrailing,
    inputClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.control}>
        {adornment && (
          <span className={styles.adornment} aria-hidden>
            {adornment}
          </span>
        )}
        {icon && <span className={styles.icon}>{icon}</span>}
        <input
          id={id}
          name={name}
          type={type}
          className={classes}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
        />
        {trailing && <span className={styles.trailing}>{trailing}</span>}
      </div>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}

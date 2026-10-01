import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./SelectField.module.css";

type SelectOption = {
  value: string;
  label: string;
};

type SelectFieldProps = {
  id: string;
  name: string;
  label: string;
  options: (SelectOption & { disabled?: boolean })[];
  placeholder?: string;
  error?: string;
  hint?: string;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "name">;

/** Labeled, styled native select wiring `aria-invalid`/`aria-describedby` from `error` (matches TextField, ADR-8). */
export default function SelectField({
  id,
  name,
  label,
  options,
  placeholder,
  error,
  hint,
  ...selectProps
}: SelectFieldProps) {
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
      {/* Native select (OS pickers on phones) restyled with a drawn chevron. */}
      <div className={styles.control}>
        <select
          id={id}
          name={name}
          className={styles.select}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...selectProps}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden size={18} className={styles.chevron} />
      </div>
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

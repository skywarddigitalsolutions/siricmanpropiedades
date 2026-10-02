import Dropdown, { type DropdownProps } from "@/components/site/Dropdown/Dropdown";
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
} & Pick<DropdownProps, "defaultValue" | "value" | "onChange" | "disabled" | "required">;

/**
 * Labeled styled dropdown wiring `aria-invalid`/`aria-describedby` from `error`
 * (matches TextField, ADR-8). Same panel as the public site's dropdowns.
 */
export default function SelectField({
  id,
  name,
  label,
  options,
  placeholder,
  error,
  hint,
  ...dropdownProps
}: SelectFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;
  const items = placeholder !== undefined ? [{ value: "", label: placeholder }, ...options] : options;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <Dropdown
        id={id}
        name={name}
        options={items}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={styles.control}
        triggerClassName={styles.select}
        {...dropdownProps}
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

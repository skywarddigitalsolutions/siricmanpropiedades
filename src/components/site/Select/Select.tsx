import { Children, isValidElement, type ReactNode } from "react";
import Dropdown, { type DropdownOption, type DropdownProps } from "../Dropdown/Dropdown";
import styles from "./Select.module.css";

type SelectVariant = "pill" | "field" | "bare";

type SelectProps = Pick<
  DropdownProps,
  | "id"
  | "name"
  | "defaultValue"
  | "value"
  | "disabled"
  | "required"
  | "aria-invalid"
  | "aria-describedby"
  | "aria-label"
  | "aria-labelledby"
  | "onChange"
> & {
  /** `<option value disabled>` elements, as with a native select. */
  children: ReactNode;
  /** `pill`: sort/filter bars. `field`: form inputs. `bare`: borderless, for use inside a bordered container. */
  variant?: SelectVariant;
  className?: string;
};

function toOptions(children: ReactNode): DropdownOption[] {
  const options: DropdownOption[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement<{ value?: string; disabled?: boolean; children?: ReactNode }>(child)) return;
    const { value, disabled, children: label } = child.props;
    const text = Children.toArray(label).join("");
    options.push({ value: value ?? text, label: text, disabled });
  });
  return options;
}

/**
 * Styled dropdown (same panel as the location suggestions) that keeps the
 * `<select>` API: `<option>` children, `name`, `defaultValue`, form value via
 * a hidden input. Never opens the OS picker.
 */
export default function Select({
  variant = "field",
  className,
  children,
  ...props
}: SelectProps) {
  return (
    <Dropdown
      {...props}
      options={toOptions(children)}
      className={`${styles.wrapper} ${styles[variant]}`}
      triggerClassName={[styles.select, className].filter(Boolean).join(" ")}
    />
  );
}

import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./Select.module.css";

type SelectVariant = "pill" | "field" | "bare";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  /** `pill`: sort/filter bars. `field`: form inputs. `bare`: borderless, for use inside a bordered container. */
  variant?: SelectVariant;
};

/**
 * Native `<select>` (OS picker on mobile, form semantics intact) with a custom
 * chevron and room on the right so the arrow never touches the border.
 */
export default function Select({ variant = "field", className, children, ...props }: SelectProps) {
  return (
    <span className={`${styles.wrapper} ${styles[variant]}`}>
      <select {...props} className={[styles.select, className].filter(Boolean).join(" ")}>
        {children}
      </select>
      <ChevronDown aria-hidden="true" focusable="false" size={18} className={styles.chevron} />
    </span>
  );
}

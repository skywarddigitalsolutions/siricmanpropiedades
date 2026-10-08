import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import styles from "./IconButton.module.css";

type Common = {
  /** Accessible name (read by screen readers; may carry context, e.g. the property title). */
  label: string;
  /** Short text shown on hover/focus; defaults to `label`. */
  tooltip?: string;
  icon: LucideIcon;
  tone?: "default" | "danger" | "primary";
};

type IconButtonProps = Common &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-label">;

/** Square icon-only button (40px) with an accessible name and a CSS tooltip. */
export default function IconButton({
  label,
  tooltip,
  icon: Icon,
  tone = "default",
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      data-tooltip={tooltip ?? label}
      data-tone={tone}
      className={styles.button}
      {...rest}
    >
      <Icon aria-hidden size={18} />
    </button>
  );
}

type IconLinkProps = Common &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "aria-label"> & {
    href: string;
    /** Opens in a new tab with `noopener noreferrer`. */
    external?: boolean;
  };

/** The link twin of `IconButton`. */
export function IconLink({
  label,
  tooltip,
  icon: Icon,
  tone = "default",
  external,
  ...rest
}: IconLinkProps) {
  return (
    <a
      aria-label={label}
      data-tooltip={tooltip ?? label}
      data-tone={tone}
      className={styles.button}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      <Icon aria-hidden size={18} />
    </a>
  );
}

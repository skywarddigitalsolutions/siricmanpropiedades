import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost";

type Appearance = {
  variant?: ButtonVariant;
  /** Decorative leading icon (mark it `aria-hidden`). */
  icon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
};

/** Class + data attributes shared by `Button`, `ButtonLink` and `SubmitButton`. */
export function buttonAttrs({
  variant = "primary",
  fullWidth,
  className,
}: Pick<Appearance, "variant" | "fullWidth" | "className">) {
  return {
    className: className ? `${styles.button} ${className}` : styles.button,
    "data-variant": variant,
    "data-full": fullWidth ? "" : undefined,
  };
}

type ButtonProps = Appearance & ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Admin button. Every state of every variant sets its own text color: the
 * global `a:hover` gold only reaches links that do not, and a navy button must
 * never turn gold on hover/active.
 */
export default function Button({
  variant,
  icon,
  fullWidth,
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button type={type} {...buttonAttrs({ variant, fullWidth, className })} {...rest}>
      {icon}
      {children}
    </button>
  );
}

type ButtonLinkProps = Appearance &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
    /** Plain `<a>` instead of `next/link` (file downloads, route handlers). */
    native?: boolean;
  };

/** A link that looks like a `Button`. */
export function ButtonLink({
  variant,
  icon,
  fullWidth,
  className,
  native,
  children,
  href,
  ...rest
}: ButtonLinkProps) {
  const attrs = buttonAttrs({ variant, fullWidth, className });
  const content = (
    <>
      {icon}
      {children}
    </>
  );

  return native ? (
    <a href={href} {...attrs} {...rest}>
      {content}
    </a>
  ) : (
    <Link href={href} {...attrs} {...rest}>
      {content}
    </Link>
  );
}

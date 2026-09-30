import type { ReactNode } from "react";
import styles from "./AdminHeader.module.css";

type AdminHeaderProps = {
  userName: string;
  children?: ReactNode;
};

/**
 * Presentational header for the `(panel)` layout: shows the signed-in user's
 * name and an optional trailing slot (the `(panel)` layout passes
 * `<LogoutButton>` there — see the route tree in `design.md`'s ADR-7).
 */
export default function AdminHeader({ userName, children }: AdminHeaderProps) {
  return (
    <header className={styles.header}>
      <span className={styles.userName}>{userName}</span>
      {children}
    </header>
  );
}

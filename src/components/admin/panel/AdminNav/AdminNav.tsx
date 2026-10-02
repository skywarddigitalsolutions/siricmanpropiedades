"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AdminNav.module.css";
import { ADMIN_NAV_ITEMS } from "./nav-items";

type AdminNavProps = {
  className?: string;
  onNavigate?: () => void;
  /** Counts shown next to items, keyed by href (e.g. new leads). */
  badges?: Record<string, number>;
  /** Shows the admin-only items (Usuarios). */
  isAdmin?: boolean;
};

/** Panel nav links from `ADMIN_NAV_ITEMS`, marking the active one with `aria-current="page"`. */
export default function AdminNav({
  className,
  onNavigate,
  badges = {},
  isAdmin = false,
}: AdminNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={className ? `${styles.nav} ${className}` : styles.nav}
      aria-label="Secciones del panel"
    >
      {ADMIN_NAV_ITEMS.filter((item) => isAdmin || !item.adminOnly).map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive ? `${styles.link} ${styles.linkActive}` : styles.link
            }
            onClick={onNavigate}
          >
            <Icon aria-hidden size={20} className={styles.icon} />
            {item.label}
            {badges[item.href] ? (
              <>
                <span className={styles.badge} aria-hidden="true">
                  {badges[item.href]}
                </span>
                <span className="sr-only">, {badges[item.href]} nuevas</span>
              </>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

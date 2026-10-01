"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AdminNav.module.css";
import { ADMIN_NAV_ITEMS } from "./nav-items";

type AdminNavProps = {
  className?: string;
  onNavigate?: () => void;
};

/** Panel nav links from `ADMIN_NAV_ITEMS`, marking the active one with `aria-current="page"`. */
export default function AdminNav({ className, onNavigate }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={className ? `${styles.nav} ${className}` : styles.nav}
      aria-label="Secciones del panel"
    >
      {ADMIN_NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href || pathname?.startsWith(`${item.href}/`);

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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

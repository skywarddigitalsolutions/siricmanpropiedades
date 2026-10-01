"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Menu, X } from "lucide-react";
import AdminNav from "../AdminNav/AdminNav";
import styles from "./AdminShell.module.css";

type AdminShellProps = {
  userName: string;
  logout: ReactNode;
  /** Counts shown in the nav, keyed by href (e.g. new leads). */
  navBadges?: Record<string, number>;
  children: ReactNode;
};

const DRAWER_ID = "admin-nav-drawer";

/**
 * Mobile-first panel shell (ADR-7 route tree, feature 6 T2): a sticky top bar
 * with a menu button on phones that opens a nav drawer, and a persistent left
 * sidebar from 960px. Stays a client component so it can own the drawer's
 * open state; the `(panel)` layout (a Server Component) passes `userName`
 * and the `logout` control (already wired to the `logoutAction` Server
 * Action) as props.
 */
export default function AdminShell({
  userName,
  logout,
  navBadges,
  children,
}: AdminShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <span className={styles.brand}>
          Siricman <span className={styles.brandDot}>·</span> Panel
        </span>
        <button
          type="button"
          className={styles.menuButton}
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          aria-controls={DRAWER_ID}
          onClick={() => setMenuOpen(true)}
        >
          <Menu size={22} aria-hidden="true" />
        </button>
      </header>

      <aside className={styles.sidebar}>
        <span className={styles.brand}>
          Siricman <span className={styles.brandDot}>·</span> Panel
        </span>
        <AdminNav className={styles.sidebarNav} badges={navBadges} />
        <div className={styles.sidebarFooter}>
          <span className={styles.userName}>{userName}</span>
          {logout}
        </div>
      </aside>

      {menuOpen && (
        <div
          id={DRAWER_ID}
          role="dialog"
          aria-modal="true"
          aria-label="Navegación del panel"
          className={styles.drawer}
        >
          <div className={styles.drawerTop}>
            <span className={styles.brand}>
              Siricman <span className={styles.brandDot}>·</span> Panel
            </span>
            <button
              type="button"
              aria-label="Cerrar menú"
              className={styles.closeButton}
              onClick={closeMenu}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <AdminNav className={styles.drawerNav} onNavigate={closeMenu} badges={navBadges} />

          <div className={styles.drawerFooter}>
            <span className={styles.userName}>{userName}</span>
            {logout}
          </div>
        </div>
      )}

      <main className={styles.main}>{children}</main>
    </div>
  );
}

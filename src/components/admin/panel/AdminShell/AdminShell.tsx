"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import AdminNav from "../AdminNav/AdminNav";
import UserCard from "../UserCard/UserCard";
import styles from "./AdminShell.module.css";

/** Sidebar/top-bar brand: transparent emblem plus a Manrope wordmark. */
function Brand() {
  return (
    <span className={styles.brand}>
      <Image src="/brand/logo-emblem.png" alt="" width={256} height={242} className={styles.brandEmblem} />
      Siricman <span className={styles.brandDot}>·</span> Panel
    </span>
  );
}

type AdminShellProps = {
  userName: string;
  /** Roles of the signed-in user: drives the role label and the admin-only nav items. */
  roles?: string[];
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
  roles = [],
  logout,
  navBadges,
  children,
}: AdminShellProps) {
  const isAdmin = roles.includes("admin");
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
        <Brand />
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
        <Brand />
        <AdminNav className={styles.sidebarNav} badges={navBadges} isAdmin={isAdmin} />
        <div className={styles.sidebarFooter}>
          <UserCard userName={userName} roles={roles} tone="dark" />
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
            <Brand />
            <button
              type="button"
              aria-label="Cerrar menú"
              className={styles.closeButton}
              onClick={closeMenu}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <AdminNav
            className={styles.drawerNav}
            onNavigate={closeMenu}
            badges={navBadges}
            isAdmin={isAdmin}
          />

          <div className={styles.drawerFooter}>
            <UserCard userName={userName} roles={roles} />
            {logout}
          </div>
        </div>
      )}

      <main className={styles.main}>{children}</main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Menu, X } from "lucide-react";
import styles from "./Header.module.css";

type NavItem = {
  label: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Comprar", href: "/propiedades?operacion=venta" },
  { label: "Alquilar", href: "/propiedades?operacion=alquiler" },
  { label: "Tasaciones", href: "/tasaciones" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Contacto", href: "/contacto" },
];

export default function Header() {
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

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <Image
            src="/brand/logo-emblem.png"
            alt="Siricman Propiedades"
            width={256}
            height={242}
            className={styles.logoImg}
            priority
          />
          <span className={styles.wordmark}>
            <span className={styles.brandName}>SIRICMAN</span>
            <span className={styles.brandSub}>PROPIEDADES</span>
          </span>
        </Link>

        <nav className={styles.nav} aria-label="Navegación principal">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <Link href="/tasaciones" className={styles.cta}>
            Tasá tu propiedad
          </Link>
          <button
            type="button"
            className={styles.menuButton}
            aria-label="Menú"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
          className={styles.mobileMenu}
        >
          <div className={styles.mobileMenuTop}>
            <span className={styles.brandName}>SIRICMAN</span>
            <button
              type="button"
              aria-label="Cerrar"
              className={styles.closeButton}
              onClick={() => setMenuOpen(false)}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <nav className={styles.mobileNav} aria-label="Navegación principal">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={styles.mobileNavLink}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
                <ChevronRight size={20} aria-hidden="true" />
              </Link>
            ))}
          </nav>

          <Link
            href="/tasaciones"
            className={styles.mobileCta}
            onClick={() => setMenuOpen(false)}
          >
            Tasá tu propiedad
          </Link>

          <span className={styles.mobileContact}>
            Las Casas 4054, 1° B · Boedo
            <br />
            10:30 a 18:00 · con cita previa
          </span>
        </div>
      )}
    </header>
  );
}

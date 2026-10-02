"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronRight, Heart, Menu, X } from "lucide-react";
import { useFavorites } from "@/lib/favorites/use-favorites";
import styles from "./Header.module.css";

type NavItem = {
  label: string;
  href: string;
  /** Path that makes the item current. */
  path: string;
  /** For search pages: the `operacion` value that makes the item current. */
  operation?: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Comprar", href: "/propiedades?operacion=venta", path: "/propiedades", operation: "venta" },
  {
    label: "Alquilar",
    href: "/propiedades?operacion=alquiler",
    path: "/propiedades",
    operation: "alquiler",
  },
  { label: "Tasaciones", href: "/tasaciones", path: "/tasaciones" },
  { label: "Nosotros", href: "/nosotros", path: "/nosotros" },
  { label: "Contacto", href: "/contacto", path: "/contacto" },
];

function isCurrent(item: NavItem, pathname: string | null, operation: string | null) {
  if (pathname !== item.path) return false;
  return item.operation ? item.operation === operation : true;
}

type NavLinksProps = {
  variant: "desktop" | "mobile";
  pathname: string | null;
  operation: string | null;
  onNavigate?: () => void;
};

function NavLinks({ variant, pathname, operation, onNavigate }: NavLinksProps) {
  const mobile = variant === "mobile";
  return (
    <>
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={mobile ? styles.mobileNavLink : styles.navLink}
          aria-current={isCurrent(item, pathname, operation) ? "page" : undefined}
          onClick={onNavigate}
        >
          {item.label}
          {mobile && <ChevronRight size={20} aria-hidden="true" />}
        </Link>
      ))}
    </>
  );
}

/** Reads the search params (which needs a Suspense boundary) to tell Comprar from Alquilar. */
function CurrentNavLinks(props: Omit<NavLinksProps, "operation">) {
  const operation = useSearchParams()?.get("operacion") ?? null;
  return <NavLinks {...props} operation={operation} />;
}

function SectionLinks(props: Omit<NavLinksProps, "operation">) {
  return (
    <Suspense fallback={<NavLinks {...props} operation={null} />}>
      <CurrentNavLinks {...props} />
    </Suspense>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const pathname = usePathname();
  const { count, mounted } = useFavorites();
  // Nothing until mounted: the server cannot know the visitor's saved list.
  const badge = mounted && count > 0 ? count : null;

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // The native modal dialog traps focus and makes the page inert; this keeps
  // it in step with the state, locks the page scroll and returns focus.
  useEffect(() => {
    const dialog = menuRef.current;
    if (!dialog) return;
    if (menuOpen) {
      wasOpen.current = true;
      if (!dialog.open) {
        if (typeof dialog.showModal === "function") dialog.showModal();
        else dialog.setAttribute("open", "");
      }
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
    if (dialog.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
    if (wasOpen.current) {
      wasOpen.current = false;
      menuButtonRef.current?.focus();
    }
  }, [menuOpen]);

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
          <SectionLinks variant="desktop" pathname={pathname} />
        </nav>

        <div className={styles.actions}>
          <Link
            href="/favoritos"
            className={styles.favoritesLink}
            aria-label={badge ? `Favoritos, ${badge} guardadas` : "Favoritos"}
          >
            <Heart size={20} aria-hidden="true" />
            {badge !== null && <span className={styles.favoritesBadge}>{badge}</span>}
          </Link>
          <Link href="/tasaciones" className={styles.cta}>
            Tasá tu propiedad
          </Link>
          <button
            ref={menuButtonRef}
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

      <dialog
        ref={menuRef}
        id="mobile-menu"
        aria-label="Menú de navegación"
        className={styles.mobileMenu}
        onClose={closeMenu}
      >
        {menuOpen && (
          <>
            <div className={styles.mobileMenuTop}>
              <span className={styles.brandName}>SIRICMAN</span>
              <button
                type="button"
                aria-label="Cerrar"
                className={styles.closeButton}
                onClick={closeMenu}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <nav className={styles.mobileNav} aria-label="Navegación principal">
              <SectionLinks variant="mobile" pathname={pathname} onNavigate={closeMenu} />
            </nav>

            <Link href="/favoritos" className={styles.mobileNavLink} onClick={closeMenu}>
              <span className={styles.mobileFavorites}>
                Favoritos
                {badge !== null && <span className={styles.favoritesBadge}>{badge}</span>}
              </span>
              <Heart size={20} aria-hidden="true" />
            </Link>

            <Link href="/tasaciones" className={styles.mobileCta} onClick={closeMenu}>
              Tasá tu propiedad
            </Link>

            <span className={styles.mobileContact}>
              Las Casas 4054, 1° B · Boedo
              <br />
              10:30 a 18:00 · con cita previa
            </span>
          </>
        )}
      </dialog>
    </header>
  );
}

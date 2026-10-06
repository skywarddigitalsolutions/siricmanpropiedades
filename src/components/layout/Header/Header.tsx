"use client";

import { Suspense, useCallback, useEffect, useRef, useState, type FocusEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Heart, Menu, Phone, X } from "lucide-react";
import WhatsAppIcon from "@/components/site/WhatsAppIcon/WhatsAppIcon";
import { PHONE_HREF } from "@/lib/contact";
import { useFavorites } from "@/lib/favorites/use-favorites";
import { WHATSAPP_DEFAULT_MESSAGE, WHATSAPP_PHONE, buildWhatsAppLink } from "@/lib/whatsapp";
import styles from "./Header.module.css";
import { useHideOnScroll } from "./useHideOnScroll";

type NavItem = {
  label: string;
  href: string;
  /** Path that makes the item current. */
  path: string;
  /** For search pages: the `operacion` value that makes the item current. */
  operation?: string;
};

const WHATSAPP_HREF = buildWhatsAppLink(WHATSAPP_PHONE, WHATSAPP_DEFAULT_MESSAGE);

const NAV_ITEMS: NavItem[] = [
  { label: "Comprar", href: "/propiedades?operacion=venta", path: "/propiedades", operation: "venta" },
  {
    label: "Alquilar",
    href: "/propiedades?operacion=alquiler",
    path: "/propiedades",
    operation: "alquiler",
  },
  { label: "Tasaciones", href: "/tasaciones", path: "/tasaciones" },
  {
    label: "Consorcios",
    href: "/administracion-de-consorcios",
    path: "/administracion-de-consorcios",
  },
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

/** Emblem + wordmark lockup linking home; shared by the header bar and the menu. */
function Brand({ priority = false, onNavigate }: { priority?: boolean; onNavigate?: () => void }) {
  return (
    <Link href="/" className={styles.brand} onClick={onNavigate}>
      <Image
        src="/brand/logo-emblem.png"
        alt="Siricman Propiedades"
        width={256}
        height={242}
        className={styles.logoImg}
        priority={priority}
      />
      <span className={styles.wordmark}>
        <span className={styles.brandName}>SIRICMAN</span>
        <span className={styles.brandSub}>PROPIEDADES</span>
      </span>
    </Link>
  );
}

/** Scroll offset (px) past which the home header turns back to solid. */
const GLASS_SCROLL_LIMIT = 8;

/**
 * Whether the page is scrolled past the glass threshold. Starts false so the
 * server render and first paint on home are already glass (no flash).
 */
function useScrolledPast(limit: number, enabled: boolean) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    // React bails out when the value is unchanged, so no extra throttling.
    const update = () => setScrolled(window.scrollY > limit);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [limit, enabled]);

  return scrolled;
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const headerRef = useRef<HTMLElement>(null);
  const [focusInside, setFocusInside] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const scrolled = useScrolledPast(GLASS_SCROLL_LIMIT, isHome);
  // Glass over the home hero while at the top; the CSS applies it below 960px only.
  const glass = isHome && !scrolled;
  const { count, mounted } = useFavorites();
  // Nothing until mounted: the server cannot know the visitor's saved list.
  const badge = mounted && count > 0 ? count : null;

  // Never slide away while the menu is open or keyboard focus is inside.
  const hidden = useHideOnScroll(headerRef, menuOpen || focusInside);
  const onBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusInside(false);
  };

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
    <header
      ref={headerRef}
      className={styles.header}
      data-variant={glass ? "glass" : undefined}
      data-hidden={hidden ? "" : undefined}
      onFocus={() => setFocusInside(true)}
      onBlur={onBlur}
    >
      <div className={styles.inner}>
        <Brand priority />

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
              <Brand onNavigate={closeMenu} />
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

            <div className={styles.mobileContactActions}>
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.contactAction} ${styles.whatsappAction}`}
                onClick={closeMenu}
              >
                <WhatsAppIcon size={20} />
                WhatsApp
              </a>
              <a
                href={PHONE_HREF}
                className={`${styles.contactAction} ${styles.callAction}`}
                onClick={closeMenu}
              >
                <Phone size={20} aria-hidden="true" />
                Llamar
              </a>
            </div>
          </>
        )}
      </dialog>
    </header>
  );
}

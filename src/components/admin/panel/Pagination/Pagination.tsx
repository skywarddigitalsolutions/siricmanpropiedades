import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPageItems } from "@/lib/pagination";
import styles from "./Pagination.module.css";

type PaginationProps = {
  /** Accessible name of the nav, e.g. "Paginación de propiedades". */
  label: string;
  page: number;
  totalPages: number;
  /** Count text, e.g. "12 propiedades". */
  totalLabel: string;
  /** URL of a page; the URL stays the only state (server-rendered links). */
  hrefFor: (page: number) => string;
};

/**
 * Numbered pagination for panel lists: icon prev/next, page numbers with
 * ellipses and the current page as a filled navy circle (`aria-current`).
 */
export default function Pagination({
  label,
  page,
  totalPages,
  totalLabel,
  hrefFor,
}: PaginationProps) {
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav className={styles.nav} aria-label={label}>
      <span className={styles.total}>{totalLabel}</span>
      <span className="sr-only">
        Página {page} de {totalPages}
      </span>
      <ul className={styles.controls}>
        <li>
          {hasPrevious ? (
            <Link href={hrefFor(page - 1)} className={styles.control} aria-label="Anterior">
              <ChevronLeft aria-hidden size={18} />
            </Link>
          ) : (
            <span className={styles.control} aria-label="Anterior" aria-disabled="true">
              <ChevronLeft aria-hidden size={18} />
            </span>
          )}
        </li>
        {getPageItems(page, totalPages).map((item) => {
          if (typeof item === "string") {
            return (
              <li key={item} className={styles.ellipsis} aria-hidden="true">
                …
              </li>
            );
          }
          return (
            <li key={item}>
              {item === page ? (
                <span className={`${styles.control} ${styles.current}`} aria-current="page">
                  {item}
                </span>
              ) : (
                <Link
                  href={hrefFor(item)}
                  className={styles.control}
                  aria-label={`Página ${item}`}
                >
                  {item}
                </Link>
              )}
            </li>
          );
        })}
        <li>
          {hasNext ? (
            <Link href={hrefFor(page + 1)} className={styles.control} aria-label="Siguiente">
              <ChevronRight aria-hidden size={18} />
            </Link>
          ) : (
            <span className={styles.control} aria-label="Siguiente" aria-disabled="true">
              <ChevronRight aria-hidden size={18} />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}

import Link from "next/link";
import styles from "./Pagination.module.css";

type PaginationProps = {
  /** Accessible name of the nav, e.g. "Paginación de propiedades". */
  label: string;
  page: number;
  totalPages: number;
  /** Count text, e.g. "12 propiedades". */
  totalLabel: string;
  /** `undefined` on the first page. */
  previousHref?: string;
  /** `undefined` on the last page. */
  nextHref?: string;
};

/** "Anterior"/"Siguiente" + "Página X de Y" + total count for panel lists. */
export default function Pagination({
  label,
  page,
  totalPages,
  totalLabel,
  previousHref,
  nextHref,
}: PaginationProps) {
  return (
    <nav className={styles.nav} aria-label={label}>
      <span className={styles.total}>{totalLabel}</span>
      <div className={styles.controls}>
        {previousHref ? (
          <Link href={previousHref} className={styles.link}>
            Anterior
          </Link>
        ) : (
          <span className={styles.disabled} aria-disabled="true">
            Anterior
          </span>
        )}
        <span className={styles.status}>
          Página {page} de {totalPages}
        </span>
        {nextHref ? (
          <Link href={nextHref} className={styles.link}>
            Siguiente
          </Link>
        ) : (
          <span className={styles.disabled} aria-disabled="true">
            Siguiente
          </span>
        )}
      </div>
    </nav>
  );
}

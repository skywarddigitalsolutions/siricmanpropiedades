import Link from "next/link";
import {
  buildPropertyListHref,
  type PropertyListFilters,
} from "@/lib/properties/list-params";
import styles from "./PropertyPagination.module.css";

type PropertyPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  filters: PropertyListFilters;
};

/** "Anterior"/"Siguiente" + "Página X de Y" + total count, preserving filters in every href. */
export default function PropertyPagination({
  page,
  totalPages,
  total,
  filters,
}: PropertyPaginationProps) {
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <nav className={styles.nav} aria-label="Paginación de propiedades">
      <span className={styles.total}>
        {total} {total === 1 ? "propiedad" : "propiedades"}
      </span>
      <div className={styles.controls}>
        {isFirst ? (
          <span className={styles.disabled} aria-disabled="true">
            Anterior
          </span>
        ) : (
          <Link
            href={buildPropertyListHref(filters, page - 1)}
            className={styles.link}
          >
            Anterior
          </Link>
        )}
        <span className={styles.status}>
          Página {page} de {totalPages}
        </span>
        {isLast ? (
          <span className={styles.disabled} aria-disabled="true">
            Siguiente
          </span>
        ) : (
          <Link
            href={buildPropertyListHref(filters, page + 1)}
            className={styles.link}
          >
            Siguiente
          </Link>
        )}
      </div>
    </nav>
  );
}

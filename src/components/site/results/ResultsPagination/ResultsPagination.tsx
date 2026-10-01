import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildSearchHref, type SearchState } from "@/lib/public/search-params";
import styles from "./ResultsPagination.module.css";

type ResultsPaginationProps = { state: SearchState; totalPages: number };

/** Crawlable previous/next links (real URLs) with the current position. */
export default function ResultsPagination({ state, totalPages }: ResultsPaginationProps) {
  if (totalPages <= 1) return null;
  const { page } = state;
  return (
    <nav aria-label="Paginación" className={styles.pagination}>
      {page > 1 ? (
        <Link href={buildSearchHref(state, { page: page - 1 })} rel="prev" className={styles.link}>
          <ChevronLeft aria-hidden size={18} />
          Anterior
        </Link>
      ) : (
        <span className={styles.placeholder} />
      )}
      <span className={styles.position}>
        Página {page} de {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={buildSearchHref(state, { page: page + 1 })} rel="next" className={styles.link}>
          Siguiente
          <ChevronRight aria-hidden size={18} />
        </Link>
      ) : (
        <span className={styles.placeholder} />
      )}
    </nav>
  );
}

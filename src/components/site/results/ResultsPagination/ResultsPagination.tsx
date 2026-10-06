import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { responsivePageItems } from "@/lib/public/pagination";
import { buildSearchHref, type SearchState } from "@/lib/public/search-params";
import styles from "./ResultsPagination.module.css";

type ResultsPaginationProps = { state: SearchState; totalPages: number };

/** Crawlable numbered pages (real URLs): previous, numbers with ellipsis, next. */
export default function ResultsPagination({ state, totalPages }: ResultsPaginationProps) {
  if (totalPages <= 1) return null;
  const { page } = state;
  return (
    <nav aria-label="Paginación" className={styles.pagination}>
      <p className="sr-only">
        Página {page} de {totalPages}
      </p>
      {page > 1 ? (
        <Link
          href={buildSearchHref(state, { page: page - 1 })}
          rel="prev"
          aria-label="Anterior"
          className={styles.step}
        >
          <ChevronLeft aria-hidden size={18} />
        </Link>
      ) : (
        <span className={styles.stepPlaceholder} aria-hidden />
      )}
      <ol className={styles.pages}>
        {responsivePageItems(page, totalPages).map(({ item, key, full, compact }) => (
          // data-only: the item belongs to one width's list; CSS hides it at the other.
          <li key={key} data-only={full && compact ? undefined : full ? "wide" : "narrow"}>
            {item === "ellipsis" ? (
              <span className={styles.ellipsis}>…</span>
            ) : item === page ? (
              <span aria-current="page" className={styles.current}>
                {item}
              </span>
            ) : (
              <Link
                href={buildSearchHref(state, { page: item })}
                aria-label={`Página ${item}`}
                className={styles.number}
              >
                {item}
              </Link>
            )}
          </li>
        ))}
      </ol>
      {page < totalPages ? (
        <Link
          href={buildSearchHref(state, { page: page + 1 })}
          rel="next"
          aria-label="Siguiente"
          className={styles.step}
        >
          <ChevronRight aria-hidden size={18} />
        </Link>
      ) : (
        <span className={styles.stepPlaceholder} aria-hidden />
      )}
    </nav>
  );
}

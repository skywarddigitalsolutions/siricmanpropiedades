import Link from "next/link";
import { X } from "lucide-react";
import {
  EMPTY_SEARCH,
  activeFilters,
  buildSearchHref,
  type SearchState,
} from "@/lib/public/search-params";
import type { PublicNeighborhood } from "@/lib/public/types";
import styles from "./ActiveFilters.module.css";

type ActiveFiltersProps = { state: SearchState; neighborhoods: PublicNeighborhood[] };

/** One removable chip per applied filter, plus "Limpiar todo" (keeps the operation). */
export default function ActiveFilters({ state, neighborhoods }: ActiveFiltersProps) {
  const filters = activeFilters(state, neighborhoods);
  if (filters.length === 0) return null;
  const clearHref = buildSearchHref({ ...EMPTY_SEARCH, operation: state.operation });
  return (
    <ul aria-label="Filtros aplicados" className={styles.list}>
      {filters.map((filter) => (
        <li key={filter.label}>
          <Link
            href={filter.removeHref}
            scroll={false}
            aria-label={`Quitar filtro: ${filter.label}`}
            className={styles.chip}
          >
            {filter.label}
            <X aria-hidden size={14} />
          </Link>
        </li>
      ))}
      <li>
        <Link href={clearHref} scroll={false} className={styles.clear}>
          Limpiar todo
        </Link>
      </li>
    </ul>
  );
}

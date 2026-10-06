import Link from "next/link";
import { X } from "lucide-react";
import { activeFilters, clearFiltersHref, type SearchState } from "@/lib/public/search-params";
import type { PublicNeighborhood } from "@/lib/public/types";
import styles from "./ActiveFilters.module.css";

type ActiveFiltersProps = {
  state: SearchState;
  neighborhoods: PublicNeighborhood[];
  /** False where the page already offers the same clear action (empty state). */
  showClear?: boolean;
};

/** One removable chip per applied filter, plus "Limpiar filtros" (keeps operation and sort). */
export default function ActiveFilters({ state, neighborhoods, showClear = true }: ActiveFiltersProps) {
  const filters = activeFilters(state, neighborhoods);
  if (filters.length === 0) return null;
  const clearHref = clearFiltersHref(state);
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
      {showClear && (
        <li>
          <Link href={clearHref} scroll={false} className={styles.clear}>
            Limpiar filtros
          </Link>
        </li>
      )}
    </ul>
  );
}

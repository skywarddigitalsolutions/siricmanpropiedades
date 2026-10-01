import Link from "next/link";
import TextField from "@/components/admin/forms/TextField/TextField";
import SelectField from "@/components/admin/forms/SelectField/SelectField";
import {
  DEAL_STATUSES,
  OPERATIONS,
  PROPERTY_TYPES,
  PUBLICATION_STATUSES,
} from "@/lib/properties/enums";
import {
  DEAL_STATUS_LABELS,
  OPERATION_LABELS,
  PROPERTY_TYPE_LABELS,
  PUBLICATION_STATUS_LABELS,
} from "@/lib/properties/labels";
import type { Neighborhood } from "@/lib/api/properties";
import type { PropertyListFilters } from "@/lib/properties/list-params";
import styles from "./PropertyFilters.module.css";

type PropertyFiltersProps = {
  filters: PropertyListFilters;
  neighborhoods: Neighborhood[];
  activeFilterCount: number;
};

const PUBLICATION_STATUS_OPTIONS = PUBLICATION_STATUSES.map((value) => ({
  value,
  label: PUBLICATION_STATUS_LABELS[value],
}));
const OPERATION_OPTIONS = OPERATIONS.map((value) => ({
  value,
  label: OPERATION_LABELS[value],
}));
const PROPERTY_TYPE_OPTIONS = PROPERTY_TYPES.map((value) => ({
  value,
  label: PROPERTY_TYPE_LABELS[value],
}));
const DEAL_STATUS_OPTIONS = DEAL_STATUSES.map((value) => ({
  value,
  label: DEAL_STATUS_LABELS[value],
}));

/**
 * Plain GET `<form>` for `/admin/propiedades` (feature 6 T3): works without
 * JS and the resulting URL is shareable. The search field stays always
 * visible; the rest live in a `<details>` so phones keep the list visible
 * without scrolling past every filter first.
 */
export default function PropertyFilters({
  filters,
  neighborhoods,
  activeFilterCount,
}: PropertyFiltersProps) {
  const neighborhoodOptions = neighborhoods.map((neighborhood) => ({
    value: neighborhood.id,
    label: neighborhood.name,
  }));

  return (
    <form
      method="get"
      role="search"
      aria-label="Filtrar propiedades"
      className={styles.form}
    >
      <TextField
        id="property-q"
        name="q"
        label="Buscar"
        type="search"
        defaultValue={filters.q ?? ""}
        placeholder="Título o código"
      />

      <details className={styles.details} open={activeFilterCount > 0}>
        <summary className={styles.summary}>
          Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </summary>
        <div className={styles.grid}>
          <SelectField
            id="property-publicationStatus"
            name="publicationStatus"
            label="Estado de publicación"
            placeholder="Todos"
            defaultValue={filters.publicationStatus ?? ""}
            options={PUBLICATION_STATUS_OPTIONS}
          />
          <SelectField
            id="property-operation"
            name="operation"
            label="Operación"
            placeholder="Todas"
            defaultValue={filters.operation ?? ""}
            options={OPERATION_OPTIONS}
          />
          <SelectField
            id="property-type"
            name="type"
            label="Tipo"
            placeholder="Todos"
            defaultValue={filters.type ?? ""}
            options={PROPERTY_TYPE_OPTIONS}
          />
          <SelectField
            id="property-dealStatus"
            name="dealStatus"
            label="Estado comercial"
            placeholder="Todos"
            defaultValue={filters.dealStatus ?? ""}
            options={DEAL_STATUS_OPTIONS}
          />
          <SelectField
            id="property-neighborhoodId"
            name="neighborhoodId"
            label="Barrio"
            placeholder="Todos"
            defaultValue={filters.neighborhoodId ?? ""}
            options={neighborhoodOptions}
          />
        </div>
      </details>

      <div className={styles.actions}>
        <button type="submit" className={styles.applyButton}>
          Aplicar
        </button>
        <Link href="/admin/propiedades" className={styles.clearLink}>
          Limpiar
        </Link>
      </div>
    </form>
  );
}

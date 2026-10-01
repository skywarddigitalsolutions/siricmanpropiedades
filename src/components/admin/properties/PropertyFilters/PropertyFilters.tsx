"use client";

import { useState, type ChangeEvent } from "react";
import Link from "next/link";
import TextField from "@/components/admin/forms/TextField/TextField";
import SelectField from "@/components/admin/forms/SelectField/SelectField";
import CheckboxField from "@/components/admin/forms/CheckboxField/CheckboxField";
import {
  CURRENCIES,
  DEAL_STATUSES,
  OPERATIONS,
  PROPERTY_TYPES,
} from "@/lib/properties/enums";
import {
  DEAL_STATUS_LABELS,
  OPERATION_LABELS,
  PROPERTY_TYPE_LABELS,
} from "@/lib/properties/labels";
import type { Neighborhood } from "@/lib/api/properties";
import type { PropertyListFilters } from "@/lib/properties/list-params";
import styles from "./PropertyFilters.module.css";

type PropertyFiltersProps = {
  filters: PropertyListFilters;
  neighborhoods: Neighborhood[];
  activeFilterCount: number;
};

const CURRENCY_OPTIONS = CURRENCIES.map((value) => ({
  value,
  label: value === "USD" ? "Dólares (USD)" : "Pesos (ARS)",
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
 * GET `<form>` for `/admin/propiedades` (feature 6 T3, feature 16 T1): still
 * works without JS (Aplicar) and the URL is the only state, but selects and
 * the "Sin fotos" toggle submit on change. Search and sort stay visible; the
 * rest live in a `<details>`. The publication status is a tab above the list
 * and travels here as a hidden input.
 */
export default function PropertyFilters({
  filters,
  neighborhoods,
  activeFilterCount,
}: PropertyFiltersProps) {
  const [currency, setCurrency] = useState<string>(filters.currency ?? "");
  const priceSortBlocked = currency === "";
  const sortOptions = [
    { value: "recientes", label: "Más recientes" },
    { value: "editadas", label: "Última edición" },
    {
      value: "precio-asc",
      label: "Precio: menor a mayor",
      disabled: priceSortBlocked,
    },
    {
      value: "precio-desc",
      label: "Precio: mayor a menor",
      disabled: priceSortBlocked,
    },
  ];

  function applyOnChange(event: ChangeEvent<HTMLFormElement>) {
    const target = event.target;
    if (
      target instanceof HTMLSelectElement ||
      (target instanceof HTMLInputElement && target.type === "checkbox")
    ) {
      event.currentTarget.requestSubmit();
    }
  }

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
      onChange={applyOnChange}
    >
      {filters.publicationStatus && (
        <input
          type="hidden"
          name="publicationStatus"
          value={filters.publicationStatus}
        />
      )}
      <TextField
        id="property-q"
        name="q"
        label="Buscar"
        type="search"
        defaultValue={filters.q ?? ""}
        placeholder="Código, título o dirección"
      />

      <SelectField
        id="property-orden"
        name="orden"
        label="Ordenar por"
        defaultValue={filters.orden ?? "recientes"}
        options={sortOptions}
        hint={
          priceSortBlocked
            ? "Elegí una moneda para ordenar por precio."
            : undefined
        }
      />

      <details className={styles.details} open={activeFilterCount > 0}>
        <summary className={styles.summary}>
          Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </summary>
        <div className={styles.grid}>
          <SelectField
            id="property-currency"
            name="currency"
            label="Moneda"
            placeholder="Todas"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            options={CURRENCY_OPTIONS}
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
        <CheckboxField
          id="property-hasImages"
          name="hasImages"
          value="false"
          label="Sin fotos"
          defaultChecked={filters.hasImages === false}
        />
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

"use client";

import { useState, type ChangeEvent } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import TextField from "@/components/admin/forms/TextField/TextField";
import SelectField from "@/components/admin/forms/SelectField/SelectField";
import CheckboxField from "@/components/admin/forms/CheckboxField/CheckboxField";
import { ButtonLink } from "@/components/admin/ui/Button/Button";
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
import {
  hasActiveFilters,
  type PropertyListFilters,
} from "@/lib/properties/list-params";
import styles from "./PropertyFilters.module.css";

type PropertyFiltersProps = {
  filters: PropertyListFilters;
  neighborhoods: Neighborhood[];
  activeFilterCount: number;
};

const PANEL_ID = "property-filters-panel";

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
 * GET `<form>` for `/admin/propiedades`: the URL is the only state. Desktop is
 * a single row (search grows, compact selects, "Limpiar"); on phones the
 * search sits next to a "Filtros" button that opens the rest. Selects and the
 * "Sin fotos" toggle submit on change and Enter submits the search, so there
 * is no "Aplicar" button; a `<noscript>` one keeps the form usable without JS.
 * The publication status is a tab above the list and travels as a hidden input.
 */
export default function PropertyFilters({
  filters,
  neighborhoods,
  activeFilterCount,
}: PropertyFiltersProps) {
  const [currency, setCurrency] = useState<string>(filters.currency ?? "");
  const [open, setOpen] = useState(activeFilterCount > 0);
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

  function submitForm(_value: string, form: HTMLFormElement | null) {
    form?.requestSubmit();
  }

  function applyOnChange(event: ChangeEvent<HTMLFormElement>) {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
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

      <div className={styles.searchRow}>
        <div className={styles.search}>
          <TextField
            id="property-q"
            name="q"
            label="Buscar"
            type="search"
            defaultValue={filters.q ?? ""}
            placeholder="Código, título o dirección"
            icon={<Search aria-hidden size={18} />}
          />
        </div>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={PANEL_ID}
          onClick={() => setOpen((value) => !value)}
        >
          <SlidersHorizontal aria-hidden size={18} />
          Filtros
          {activeFilterCount > 0 && (
            <>
              <span className={styles.count} aria-hidden="true">
                {activeFilterCount}
              </span>
              <span className="sr-only">
                , {activeFilterCount} {activeFilterCount === 1 ? "activo" : "activos"}
              </span>
            </>
          )}
        </button>
      </div>

      <div id={PANEL_ID} className={styles.panel} data-open={open ? "" : undefined}>
        <div className={styles.cell}>
          <SelectField
            id="property-orden"
            name="orden"
            label="Ordenar por"
            defaultValue={filters.orden ?? "recientes"}
            onChange={submitForm}
            options={sortOptions}
            hint={
              priceSortBlocked
                ? "Elegí una moneda para ordenar por precio."
                : undefined
            }
          />
        </div>
        <div className={styles.cell}>
          <SelectField
            id="property-currency"
            name="currency"
            label="Moneda"
            placeholder="Todas"
            value={currency}
            onChange={(next, form) => {
              setCurrency(next);
              form?.requestSubmit();
            }}
            options={CURRENCY_OPTIONS}
          />
        </div>
        <div className={styles.cell}>
          <SelectField
            id="property-operation"
            name="operation"
            label="Operación"
            placeholder="Todas"
            defaultValue={filters.operation ?? ""}
            onChange={submitForm}
            options={OPERATION_OPTIONS}
          />
        </div>
        <div className={styles.cell}>
          <SelectField
            id="property-type"
            name="type"
            label="Tipo"
            placeholder="Todos"
            defaultValue={filters.type ?? ""}
            onChange={submitForm}
            options={PROPERTY_TYPE_OPTIONS}
          />
        </div>
        <div className={styles.cell}>
          <SelectField
            id="property-dealStatus"
            name="dealStatus"
            label="Estado comercial"
            placeholder="Todos"
            defaultValue={filters.dealStatus ?? ""}
            onChange={submitForm}
            options={DEAL_STATUS_OPTIONS}
          />
        </div>
        <div className={styles.cell}>
          <SelectField
            id="property-neighborhoodId"
            name="neighborhoodId"
            label="Barrio"
            placeholder="Todos"
            defaultValue={filters.neighborhoodId ?? ""}
            onChange={submitForm}
            options={neighborhoodOptions}
          />
        </div>
        <div className={styles.check}>
          <CheckboxField
            id="property-hasImages"
            name="hasImages"
            value="false"
            label="Sin fotos"
            defaultChecked={filters.hasImages === false}
          />
        </div>
      </div>

      <div className={styles.actions}>
        {hasActiveFilters(filters) && (
          <ButtonLink
            href="/admin/propiedades"
            variant="ghost"
            icon={<X aria-hidden size={18} />}
          >
            Limpiar
          </ButtonLink>
        )}
        <noscript>
          <button type="submit" className={styles.noscriptSubmit}>
            Aplicar
          </button>
        </noscript>
      </div>
    </form>
  );
}

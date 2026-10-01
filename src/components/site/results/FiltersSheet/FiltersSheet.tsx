"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { PROPERTY_TYPES, type Currency } from "@/lib/properties/enums";
import { PROPERTY_TYPE_LABELS, currencySymbol } from "@/lib/properties/labels";
import {
  EMPTY_SEARCH,
  RESULTS_PATH,
  TYPE_SLUGS,
  buildSearchHref,
  countActiveFilters,
  type SearchState,
} from "@/lib/public/search-params";
import PreservedParams from "../PreservedParams/PreservedParams";
import styles from "./FiltersSheet.module.css";

/** URL params edited inside the sheet (the rest travel as hidden inputs). */
const SHEET_PARAMS = [
  "tipo",
  "ambientes",
  "dormitorios",
  "banos",
  "cochera",
  "credito",
  "mascotas",
  "moneda",
  "desde",
  "hasta",
  "codigo",
];

type PillOption = { label: string; value: string };

function PillGroup({
  legend,
  name,
  options,
  selected,
}: {
  legend: string;
  name: string;
  options: PillOption[];
  selected: string;
}) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.pills}>
        {options.map((option) => (
          <label key={option.value} className={styles.pill}>
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={option.value === selected}
              className={styles.pillInput}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const ANY: PillOption = { label: "Indistinto", value: "" };
const upTo = (max: number) => Array.from({ length: max }, (_, index) => index + 1);
/** Rooms are exact up to 4, then "5+"; the API treats every value as a minimum. */
const ROOM_OPTIONS = [ANY, ...upTo(5).map((n) => ({ label: n === 5 ? "5+" : String(n), value: String(n) }))];
const minimumOptions = (max: number) => [
  ANY,
  ...upTo(max).map((n) => ({ label: `${n}+`, value: String(n) })),
];

/**
 * "Filtros" button and its sheet: a modal `<dialog>` (bottom sheet on phones,
 * side panel from 960 px) holding a GET form with every secondary filter.
 */
export default function FiltersSheet({ state }: { state: SearchState }) {
  const [open, setOpen] = useState(false);
  const [priceCurrency, setPriceCurrency] = useState<Currency | undefined>(state.currency);
  const symbol = currencySymbol(
    priceCurrency ?? (state.operation === "rent" ? "ARS" : "USD"),
  );
  const dialogRef = useRef<HTMLDialogElement>(null);
  const active = countActiveFilters(state);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    // showModal gives focus trapping, Escape and a backdrop; fall back to the
    // attribute where it is missing (older browsers, jsdom).
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }, [open]);

  const clearHref = buildSearchHref({
    ...EMPTY_SEARCH,
    operation: state.operation,
    neighborhood: state.neighborhood,
    sort: state.sort,
  });

  return (
    <>
      <button type="button" className={styles.trigger} onClick={() => setOpen(true)}>
        <SlidersHorizontal aria-hidden size={15} />
        {active ? `Filtros · ${active}` : "Filtros"}
      </button>

      {open && (
        <dialog
          ref={dialogRef}
          aria-labelledby="filters-title"
          className={styles.sheet}
          onClose={() => setOpen(false)}
          onClick={(event) => {
            // A click on the backdrop lands on the dialog element itself.
            if (event.target === event.currentTarget) event.currentTarget.close();
          }}
        >
          <form action={RESULTS_PATH} method="get" className={styles.form}>
            <PreservedParams state={state} omit={SHEET_PARAMS} />
            <div className={styles.header}>
              <h2 id="filters-title" className={styles.title}>
                Filtros
              </h2>
              <button
                type="button"
                aria-label="Cerrar filtros"
                className={styles.close}
                onClick={() => {
                  dialogRef.current?.close?.();
                  setOpen(false);
                }}
              >
                <X aria-hidden size={18} />
              </button>
            </div>

            <div className={styles.body}>
              <PillGroup
                legend="Tipo de propiedad"
                name="tipo"
                selected={state.type ? TYPE_SLUGS[state.type] : ""}
                options={[
                  { label: "Todos", value: "" },
                  ...PROPERTY_TYPES.map((type) => ({
                    label: PROPERTY_TYPE_LABELS[type],
                    value: TYPE_SLUGS[type],
                  })),
                ]}
              />

              <fieldset className={styles.group}>
                <legend className={styles.legend}>Precio</legend>
                <div className={styles.priceRow}>
                  <div className={styles.currency} role="radiogroup" aria-label="Moneda">
                    {[
                      { label: "US$", value: "USD" },
                      { label: "$", value: "ARS" },
                    ].map((currency) => (
                      <label key={currency.value} className={styles.currencyOption}>
                        <input
                          type="radio"
                          name="moneda"
                          value={currency.value}
                          defaultChecked={state.currency === currency.value}
                          onChange={() => setPriceCurrency(currency.value as Currency)}
                          aria-label={currency.value === "ARS" ? "Pesos" : "Dólares"}
                          className={styles.pillInput}
                        />
                        <span aria-hidden>{currency.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className={styles.priceField}>
                    <label htmlFor="filter-desde" className="sr-only">
                      Desde
                    </label>
                    <span className={styles.symbol} aria-hidden>
                      {symbol}
                    </span>
                    <input
                      id="filter-desde"
                      name="desde"
                      inputMode="numeric"
                      placeholder="Desde"
                      defaultValue={state.priceMin ?? ""}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.priceField}>
                    <label htmlFor="filter-hasta" className="sr-only">
                      Hasta
                    </label>
                    <span className={styles.symbol} aria-hidden>
                      {symbol}
                    </span>
                    <input
                      id="filter-hasta"
                      name="hasta"
                      inputMode="numeric"
                      placeholder="Hasta"
                      defaultValue={state.priceMax ?? ""}
                      className={styles.input}
                    />
                  </div>
                </div>
                <p className={styles.hint}>
                  Sin moneda elegida se usa dólares para venta y pesos para alquiler.
                </p>
              </fieldset>

              <PillGroup
                legend="Ambientes"
                name="ambientes"
                selected={state.rooms ? String(state.rooms) : ""}
                options={ROOM_OPTIONS}
              />
              <PillGroup
                legend="Dormitorios"
                name="dormitorios"
                selected={state.bedrooms ? String(state.bedrooms) : ""}
                options={minimumOptions(4)}
              />
              <PillGroup
                legend="Baños"
                name="banos"
                selected={state.bathrooms ? String(state.bathrooms) : ""}
                options={minimumOptions(3)}
              />

              <fieldset className={styles.group}>
                <legend className="sr-only">Condiciones</legend>
                {[
                  { name: "cochera", label: "Con cochera", checked: state.garage },
                  { name: "credito", label: "Apto crédito", checked: state.credit },
                  { name: "mascotas", label: "Acepta mascotas", checked: state.pets },
                ].map((toggle) => (
                  <label key={toggle.name} className={styles.toggle}>
                    <span>{toggle.label}</span>
                    <input
                      type="checkbox"
                      name={toggle.name}
                      value="1"
                      defaultChecked={toggle.checked}
                      className={styles.switch}
                    />
                  </label>
                ))}
              </fieldset>
            </div>

            <div className={styles.footer}>
              <Link href={clearHref} className={styles.clear}>
                Limpiar
              </Link>
              <button type="submit" className={styles.submit}>
                Ver resultados
              </button>
            </div>
          </form>
        </dialog>
      )}
    </>
  );
}

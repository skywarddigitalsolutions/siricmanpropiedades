"use client";

import { RESULTS_PATH, type SearchState } from "@/lib/public/search-params";
import Select from "../../Select/Select";
import PreservedParams from "../PreservedParams/PreservedParams";
import styles from "./ResultsSort.module.css";

const OPTIONS = [
  { value: "recientes", label: "Más recientes" },
  { value: "menor-precio", label: "Menor precio" },
  { value: "mayor-precio", label: "Mayor precio" },
];

/** Sort select that applies on change (a submit button covers no-JS visitors). */
export default function ResultsSort({ state }: { state: SearchState }) {
  return (
    <form action={RESULTS_PATH} method="get" className={styles.form}>
      <PreservedParams state={state} omit={["orden"]} />
      <label htmlFor="results-sort" className="sr-only">
        Ordenar por
      </label>
      <Select
        variant="pill"
        id="results-sort"
        name="orden"
        defaultValue={state.sort}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <noscript>
        <button type="submit" className={styles.apply}>
          Ordenar
        </button>
      </noscript>
    </form>
  );
}

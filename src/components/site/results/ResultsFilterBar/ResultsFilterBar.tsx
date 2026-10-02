import Link from "next/link";
import type { Operation } from "@/lib/properties/enums";
import {
  RESULTS_PATH,
  buildSearchHref,
  type SearchState,
} from "@/lib/public/search-params";
import type { PublicNeighborhood } from "@/lib/public/types";
import LocationCombobox from "../../LocationCombobox/LocationCombobox";
import FiltersSheet from "../FiltersSheet/FiltersSheet";
import PreservedParams from "../PreservedParams/PreservedParams";
import styles from "./ResultsFilterBar.module.css";

const OPERATIONS: { label: string; value?: Operation }[] = [
  { label: "Todas" },
  { label: "Comprar", value: "sale" },
  { label: "Alquilar", value: "rent" },
];

type QuickFilter = { label: string; active: boolean; patch: Partial<SearchState> };

function quickFilters(state: SearchState): QuickFilter[] {
  const types = [
    { label: "Departamento", type: "apartment" },
    { label: "Casa", type: "house" },
    { label: "PH", type: "ph" },
  ] as const;
  return [
    ...types.map(({ label, type }) => ({
      label,
      active: state.type === type,
      patch: { type: state.type === type ? undefined : type },
    })),
    ...[2, 3].map((rooms) => ({
      label: `${rooms} amb.`,
      active: state.rooms === rooms,
      patch: { rooms: state.rooms === rooms ? undefined : rooms },
    })),
    { label: "Apto crédito", active: state.credit, patch: { credit: !state.credit } },
    { label: "Mascotas", active: state.pets, patch: { pets: !state.pets } },
    { label: "Cochera", active: state.garage, patch: { garage: !state.garage } },
  ];
}

type ResultsFilterBarProps = {
  state: SearchState;
  neighborhoods: PublicNeighborhood[];
};

/**
 * Sticky bar above the results: operation, barrio, the filters sheet and
 * quick toggles. Everything is a link or a GET form, so the URL is the state.
 */
export default function ResultsFilterBar({ state, neighborhoods }: ResultsFilterBarProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.row}>
          <nav aria-label="Operación" className={styles.segment}>
            {OPERATIONS.map(({ label, value }) => {
              const current = state.operation === value;
              return (
                <Link
                  key={label}
                  scroll={false}
                  href={buildSearchHref(state, { operation: value })}
                  aria-current={current ? "page" : undefined}
                  className={styles.segmentLink}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <form action={RESULTS_PATH} method="get" className={styles.barrio}>
            <PreservedParams state={state} omit={["barrio"]} />
            <LocationCombobox
              id="results-barrio"
              variant="bar"
              neighborhoods={neighborhoods}
              defaultSlug={state.neighborhood}
              autoSubmit
            />
            <noscript>
              <button type="submit" className={styles.noscriptButton}>
                Ir
              </button>
            </noscript>
          </form>
        </div>

        <div className={styles.chipsRow}>
          <FiltersSheet state={state} />
          <ul aria-label="Filtros rápidos" className={styles.chips}>
            {quickFilters(state).map((filter) => (
              <li key={filter.label}>
                <Link
                  href={buildSearchHref(state, filter.patch)}
                  scroll={false}
                  className={styles.chip}
                  data-active={filter.active ? "" : undefined}
                >
                  {filter.label}
                  {filter.active && <span className="sr-only"> (activo)</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

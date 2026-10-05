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

type ResultsFilterBarProps = {
  state: SearchState;
  neighborhoods: PublicNeighborhood[];
};

/**
 * Sticky bar above the results: operation, barrio and the filters sheet. Everything is a link or a GET form, so the URL is the state.
 */
export default function ResultsFilterBar({ state, neighborhoods }: ResultsFilterBarProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
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
            defaultSlug={state.neighborhoods?.join(",")}
            defaultLabel={
              state.neighborhoods && state.neighborhoods.length > 1
                ? `${state.neighborhoods.length} barrios`
                : undefined
            }
            autoSubmit
          />
          <noscript>
            <button type="submit" className={styles.noscriptButton}>
              Ir
            </button>
          </noscript>
        </form>

        <FiltersSheet state={state} neighborhoods={neighborhoods} />
      </div>
    </div>
  );
}

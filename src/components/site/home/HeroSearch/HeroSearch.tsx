import { BedDouble, House, Search } from "lucide-react";
import { PROPERTY_TYPES } from "@/lib/properties/enums";
import { PROPERTY_TYPE_LABELS } from "@/lib/properties/labels";
import { RESULTS_PATH, TYPE_SLUGS } from "@/lib/public/search-params";
import type { PublicNeighborhood } from "@/lib/public/types";
import LocationCombobox from "../../LocationCombobox/LocationCombobox";
import styles from "./HeroSearch.module.css";

const OPERATIONS = [
  { label: "Todas", value: "" },
  { label: "Comprar", value: "venta" },
  { label: "Alquilar", value: "alquiler" },
];

const ROOMS = [
  { label: "Indistinto", value: "" },
  { label: "1 amb.", value: "1" },
  { label: "2 amb.", value: "2" },
  { label: "3 amb.", value: "3" },
  { label: "4 amb.", value: "4" },
  { label: "5+ amb.", value: "5" },
];

/**
 * Home hero with the main search. A plain GET form to the results page, so
 * it works without JavaScript; empty fields are dropped by the results page,
 * which redirects to the canonical URL.
 */
export default function HeroSearch({ neighborhoods }: { neighborhoods: PublicNeighborhood[] }) {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Encontrá tu próxima propiedad en CABA</h1>
        <p className={styles.subtitle}>
          Venta y alquiler con asesoramiento personal, de principio a fin.
        </p>

        <form
          action={RESULTS_PATH}
          method="get"
          role="search"
          aria-label="Buscar propiedades"
          className={styles.form}
        >
          <fieldset className={styles.operations}>
            <legend className="sr-only">Operación</legend>
            {OPERATIONS.map((operation) => (
              <label key={operation.label} className={styles.operation}>
                <input
                  type="radio"
                  name="operacion"
                  value={operation.value}
                  defaultChecked={operation.value === ""}
                  className={styles.radio}
                />
                <span>{operation.label}</span>
              </label>
            ))}
          </fieldset>

          <div className={styles.panel}>
            <div className={styles.location}>
              <LocationCombobox
                id="hero-barrio"
                variant="field"
                caption="Ubicación"
                neighborhoods={neighborhoods}
              />
            </div>
            <label className={styles.field}>
              <House aria-hidden size={20} className={styles.icon} />
              <span className={styles.fieldText}>
                <span className={styles.caption}>Tipo</span>
                <select name="tipo" defaultValue="" className={styles.select}>
                  <option value="">Todos</option>
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type} value={TYPE_SLUGS[type]}>
                      {PROPERTY_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </span>
            </label>
            <label className={`${styles.field} ${styles.narrow}`}>
              <BedDouble aria-hidden size={20} className={styles.icon} />
              <span className={styles.fieldText}>
                <span className={styles.caption}>Ambientes</span>
                <select name="ambientes" defaultValue="" className={styles.select}>
                  {ROOMS.map((rooms) => (
                    <option key={rooms.label} value={rooms.value}>
                      {rooms.label}
                    </option>
                  ))}
                </select>
              </span>
            </label>
            <button type="submit" className={styles.submit}>
              <Search aria-hidden size={18} />
              Buscar
            </button>
          </div>
        </form>

        <details className={styles.code}>
          <summary className={styles.codeSummary}>
            ¿Tenés un código? Buscá por SP-0000
          </summary>
          <form
            action={RESULTS_PATH}
            method="get"
            role="search"
            aria-label="Buscar por código"
            className={styles.codeForm}
          >
            <label htmlFor="hero-code" className="sr-only">
              Código de la propiedad
            </label>
            <input
              id="hero-code"
              name="codigo"
              placeholder="SP-0000"
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={20}
              required
              className={styles.codeInput}
            />
            <button type="submit" className={styles.codeButton}>
              Ir
            </button>
          </form>
        </details>
      </div>
    </section>
  );
}

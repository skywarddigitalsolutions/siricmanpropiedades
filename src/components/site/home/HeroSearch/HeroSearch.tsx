import Image from "next/image";
import { BedDouble, House, Search } from "lucide-react";
import { PROPERTY_TYPES } from "@/lib/properties/enums";
import { PROPERTY_TYPE_LABELS } from "@/lib/properties/labels";
import { RESULTS_PATH, TYPE_SLUGS } from "@/lib/public/search-params";
import type { PublicNeighborhood } from "@/lib/public/types";
import LocationCombobox from "../../LocationCombobox/LocationCombobox";
import Select from "../../Select/Select";
import styles from "./HeroSearch.module.css";

const OPERATIONS = [
  { label: "Todas", value: "" },
  { label: "Comprar", value: "venta" },
  { label: "Alquilar", value: "alquiler" },
];

const ROOMS = [
  { label: "Indistinto", value: "" },
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "4", value: "4" },
  { label: "5+", value: "5" },
];

/**
 * Home hero with the main search over the owner's photo. A plain GET form to
 * the results page, so it works without JavaScript; empty fields are dropped
 * by the results page, which redirects to the canonical URL.
 */
export default function HeroSearch({ neighborhoods }: { neighborhoods: PublicNeighborhood[] }) {
  return (
    <section className={styles.hero}>
      <Image
        src="/hero.jpeg"
        alt=""
        fill
        priority
        sizes="100vw"
        className={styles.photo}
      />
      <div className={styles.overlay} aria-hidden />

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
            <div className={`${styles.segment} ${styles.location}`}>
              <LocationCombobox
                id="hero-barrio"
                variant="plain"
                caption="Ubicación"
                neighborhoods={neighborhoods}
              />
            </div>

            <div className={`${styles.segment} ${styles.type}`}>
              <House aria-hidden size={20} className={styles.icon} />
              <span className={styles.fieldText}>
                <label htmlFor="hero-tipo" className={styles.caption}>
                  Tipo
                </label>
                <Select id="hero-tipo" name="tipo" variant="bare" defaultValue="">
                  <option value="">Todos</option>
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type} value={TYPE_SLUGS[type]}>
                      {PROPERTY_TYPE_LABELS[type]}
                    </option>
                  ))}
                </Select>
              </span>
            </div>

            <div className={`${styles.segment} ${styles.rooms}`}>
              <BedDouble aria-hidden size={20} className={styles.icon} />
              <span className={styles.fieldText}>
                <label htmlFor="hero-ambientes" className={styles.caption}>
                  Ambientes
                </label>
                <Select id="hero-ambientes" name="ambientes" variant="bare" defaultValue="">
                  {ROOMS.map((rooms) => (
                    <option key={rooms.label} value={rooms.value}>
                      {rooms.label}
                    </option>
                  ))}
                </Select>
              </span>
            </div>

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

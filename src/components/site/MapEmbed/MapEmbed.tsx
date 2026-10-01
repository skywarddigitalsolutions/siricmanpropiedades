import { buildMapEmbedUrl, type MapPrecision } from "@/lib/maps";
import styles from "./MapEmbed.module.css";

type MapEmbedProps = {
  /** Free-text search: a full address (exact) or a barrio (approximate). */
  query: string;
  /** Accessible name of the iframe. */
  title: string;
  precision?: MapPrecision;
  /** Optional chip over the map, e.g. the address or "Zona aproximada". */
  label?: string;
};

/** Lazy-loaded Google Maps embed, reused by the Contacto page and the property detail. */
export default function MapEmbed({ query, title, precision = "exact", label }: MapEmbedProps) {
  return (
    <div className={styles.map}>
      <iframe
        title={title}
        src={buildMapEmbedUrl(query, precision)}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className={styles.frame}
      />
      {label && <span className={styles.chip}>{label}</span>}
    </div>
  );
}

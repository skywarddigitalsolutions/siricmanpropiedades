import Link from "next/link";
import type { Property } from "@/lib/api/properties";
import { OPERATION_LABELS, PROPERTY_TYPE_LABELS, formatPrice } from "@/lib/properties/labels";
import PublicationStatusBadge from "@/components/admin/properties/PublicationStatusBadge/PublicationStatusBadge";
import DealStatusBadge from "@/components/admin/properties/DealStatusBadge/DealStatusBadge";
import styles from "./PropertyList.module.css";

type PropertyListProps = {
  properties: Property[];
  /** Whether any filter (including `q`) is active, to pick the right empty-state copy. */
  hasActiveFilters: boolean;
};

/**
 * Renders the same property data as phone cards and a 960px+ table
 * (feature 6 T3). Both layouts stay in the DOM; CSS `display: none` hides
 * the inactive one per viewport, which also removes it from the
 * accessibility tree — so there is never more than one focusable link per
 * property at a time.
 */
export default function PropertyList({
  properties,
  hasActiveFilters,
}: PropertyListProps) {
  if (properties.length === 0) {
    return hasActiveFilters ? (
      <div className={styles.empty}>
        <p>No se encontraron propiedades con esos filtros.</p>
        <Link href="/admin/propiedades" className={styles.emptyAction}>
          Limpiar filtros
        </Link>
      </div>
    ) : (
      <div className={styles.empty}>
        <p>Todavía no hay propiedades cargadas.</p>
        <Link
          href="/admin/propiedades/nueva"
          className={styles.emptyAction}
        >
          Crear la primera propiedad
        </Link>
      </div>
    );
  }

  return (
    <>
      <ul className={styles.cards}>
        {properties.map((property) => (
          <li key={property.id} className={styles.cardItem}>
            <Link
              href={`/admin/propiedades/${property.id}`}
              className={styles.card}
            >
              <span className={styles.cardTitle}>{property.title}</span>
              <span className={styles.cardCode}>{property.code}</span>
              <span className={styles.cardMeta}>
                {OPERATION_LABELS[property.operation]} ·{" "}
                {PROPERTY_TYPE_LABELS[property.type]}
              </span>
              <span className={styles.cardMeta}>
                {property.neighborhood.name}
              </span>
              <span className={styles.cardPrice}>
                {formatPrice(property.currency, property.price)}
              </span>
              <span className={styles.cardBadges}>
                <PublicationStatusBadge status={property.publicationStatus} />
                <DealStatusBadge status={property.dealStatus} />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <table className={styles.table}>
        <caption className={styles.srOnly}>Listado de propiedades</caption>
        <thead>
          <tr>
            <th scope="col">Código</th>
            <th scope="col">Título</th>
            <th scope="col">Operación/Tipo</th>
            <th scope="col">Barrio</th>
            <th scope="col">Precio</th>
            <th scope="col">Estado</th>
            <th scope="col">Estado comercial</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((property) => (
            <tr key={property.id}>
              <td>{property.code}</td>
              <td>
                <Link href={`/admin/propiedades/${property.id}`}>
                  {property.title}
                </Link>
              </td>
              <td>
                {OPERATION_LABELS[property.operation]} /{" "}
                {PROPERTY_TYPE_LABELS[property.type]}
              </td>
              <td>{property.neighborhood.name}</td>
              <td>{formatPrice(property.currency, property.price)}</td>
              <td>
                <PublicationStatusBadge status={property.publicationStatus} />
              </td>
              <td>
                <DealStatusBadge status={property.dealStatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

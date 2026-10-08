import Image from "next/image";
import Link from "next/link";
import { Building2, ExternalLink, Plus, SearchX, X } from "lucide-react";
import type { PropertyListItem } from "@/lib/api/properties";
import type { ActionFeedback } from "@/lib/forms/action-feedback";
import { OPERATION_LABELS, PROPERTY_TYPE_LABELS, formatPrice } from "@/lib/properties/labels";
import { publicSiteHref } from "@/lib/site-url";
import EmptyState from "@/components/admin/ui/EmptyState/EmptyState";
import { ButtonLink } from "@/components/admin/ui/Button/Button";
import { IconLink } from "@/components/admin/ui/IconButton/IconButton";
import PublicationStatusBadge from "@/components/admin/properties/PublicationStatusBadge/PublicationStatusBadge";
import DealStatusBadge from "@/components/admin/properties/DealStatusBadge/DealStatusBadge";
import PropertyQuickActions from "@/components/admin/properties/PropertyQuickActions/PropertyQuickActions";
import styles from "./PropertyList.module.css";

type PublicationAction = (
  id: string,
  prev: ActionFeedback,
  formData: FormData,
) => Promise<ActionFeedback>;

type PropertyListProps = {
  properties: PropertyListItem[];
  /** Whether any filter (including `q`) is active, to pick the right empty-state copy. */
  hasActiveFilters: boolean;
  /** `changePublicationAction`, for each row's Publicar/Retirar button. */
  publicationAction: PublicationAction;
};

const NO_PHOTOS_REASON = "Agregá al menos una foto para publicar.";

function Cover({
  property,
  className,
}: {
  property: PropertyListItem;
  className: string;
}) {
  return (
    <span className={className}>
      {property.coverThumbnailUrl ? (
        <Image
          src={property.coverThumbnailUrl}
          alt=""
          fill
          sizes="(min-width: 960px) 80px, 100vw"
          className={styles.coverImage}
          unoptimized
        />
      ) : (
        <span className={styles.noPhotos}>Sin fotos</span>
      )}
      {property.imageCount > 0 && (
        <span className={styles.countBadge}>
          {property.imageCount} {property.imageCount === 1 ? "foto" : "fotos"}
        </span>
      )}
    </span>
  );
}

function RowActions({
  property,
  publicationAction,
}: {
  property: PropertyListItem;
  publicationAction: PublicationAction;
}) {
  return (
    <div className={styles.rowActions}>
      {property.publicationStatus === "published" && (
        <IconLink
          href={publicSiteHref(`/propiedades/${property.slug}`)}
          external
          icon={ExternalLink}
          label={`Ver en el sitio: ${property.title}`}
          tooltip="Ver en el sitio"
        />
      )}
      <PropertyQuickActions
        id={property.id}
        title={property.title}
        publicationStatus={property.publicationStatus}
        action={publicationAction}
        publishBlockedReason={
          property.imageCount === 0 ? NO_PHOTOS_REASON : undefined
        }
      />
    </div>
  );
}

/**
 * Renders the same property data as phone cards and a 960px+ table
 * (feature 6 T3). Both layouts stay in the DOM; CSS `display: none` hides
 * the inactive one per viewport, which also removes it from the
 * accessibility tree — so there is never more than one focusable link per
 * property at a time. The title is the editor link; the quick actions are
 * siblings of it (never nested inside a link).
 */
export default function PropertyList({
  properties,
  hasActiveFilters,
  publicationAction,
}: PropertyListProps) {
  if (properties.length === 0) {
    return hasActiveFilters ? (
      <EmptyState
        icon={SearchX}
        title="No se encontraron propiedades con esos filtros."
        description="Probá con otra búsqueda o quitá algún filtro."
      >
        <ButtonLink
          href="/admin/propiedades"
          variant="secondary"
          icon={<X aria-hidden size={18} />}
        >
          Limpiar filtros
        </ButtonLink>
      </EmptyState>
    ) : (
      <EmptyState
        icon={Building2}
        title="Todavía no hay propiedades cargadas."
        description="Cargá la primera y aparecerá acá."
      >
        <ButtonLink
          href="/admin/propiedades/nueva"
          icon={<Plus aria-hidden size={18} />}
        >
          Crear la primera propiedad
        </ButtonLink>
      </EmptyState>
    );
  }

  return (
    <>
      <ul className={styles.cards}>
        {properties.map((property) => (
          <li key={property.id} className={styles.cardItem}>
            <Cover property={property} className={styles.cardCover} />
            <div className={styles.cardBody}>
              <Link
                href={`/admin/propiedades/${property.id}`}
                className={styles.cardTitle}
              >
                {property.title}
              </Link>
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
              <RowActions
                property={property}
                publicationAction={publicationAction}
              />
            </div>
          </li>
        ))}
      </ul>

      <table className={styles.table}>
        <caption className={styles.srOnly}>Listado de propiedades</caption>
        <thead>
          <tr>
            <th scope="col">Foto</th>
            <th scope="col">Código</th>
            <th scope="col">Título</th>
            <th scope="col">Operación/Tipo</th>
            <th scope="col">Barrio</th>
            <th scope="col">Precio</th>
            <th scope="col">Estado</th>
            <th scope="col">Estado comercial</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((property) => (
            <tr key={property.id}>
              <td>
                <Cover property={property} className={styles.rowCover} />
              </td>
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
              <td>
                <RowActions
                  property={property}
                  publicationAction={publicationAction}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

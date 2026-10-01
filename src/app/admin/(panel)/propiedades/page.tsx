import Link from "next/link";
import { listNeighborhoods, listProperties } from "@/lib/api/properties";
import type {
  PropertyListItem,
  PublicationCounts,
} from "@/lib/api/properties";
import { ApiError } from "@/lib/api/client";
import { getSessionToken } from "@/lib/session/dal";
import { handleSessionError } from "@/lib/session/session-error";
import {
  countSecondaryFilters,
  hasActiveFilters,
  listOrderToApi,
  parsePropertyListParams,
  type RawSearchParams,
} from "@/lib/properties/list-params";
import PageHeader from "@/components/admin/panel/PageHeader/PageHeader";
import PropertyFilters from "@/components/admin/properties/PropertyFilters/PropertyFilters";
import PropertyStatusTabs from "@/components/admin/properties/PropertyStatusTabs/PropertyStatusTabs";
import PropertyList from "@/components/admin/properties/PropertyList/PropertyList";
import PropertyPagination from "@/components/admin/properties/PropertyPagination/PropertyPagination";
import FormAlert from "@/components/admin/forms/FormAlert/FormAlert";
import FormNotice from "@/components/admin/forms/FormNotice/FormNotice";
import { changePublicationAction } from "./[id]/lifecycle-actions";
import styles from "./page.module.css";

type AdminPropertiesPageProps = {
  searchParams: Promise<RawSearchParams>;
};

/**
 * `/admin/propiedades` — property list with filters and pagination (feature
 * 6 T3). Server Component: parses `searchParams` (a Promise since Next 15,
 * confirmed against the Next 16 docs), fetches with the session token, and
 * hands plain data to presentational components (container/presentational
 * split, design.md's "good practices").
 */
export default async function AdminPropertiesPage({
  searchParams,
}: AdminPropertiesPageProps) {
  const resolvedSearchParams = await searchParams;
  const { filters, page, limit, offset } = parsePropertyListParams(
    resolvedSearchParams,
  );
  const token = await getSessionToken();

  const neighborhoods = await listNeighborhoods();

  let items: PropertyListItem[] = [];
  let counts: PublicationCounts = { draft: 0, published: 0, archived: 0 };
  let total = 0;
  let notice: string | undefined;

  try {
    const { orden, ...apiFilters } = filters;
    const result = await listProperties(token, {
      ...apiFilters,
      ...listOrderToApi(orden),
      limit,
      offset,
    });
    items = result.items;
    counts = result.counts;
    total = result.total;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      handleSessionError(error);
    }
    if (!(error instanceof ApiError) || error.status !== 400) {
      throw error;
    }
    notice =
      "No se pudieron aplicar los filtros indicados; mostrando la lista vacía.";
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className={styles.page}>
      <PageHeader
        title="Propiedades"
        actions={
          <Link href="/admin/propiedades/nueva" className={styles.newButton}>
            Nueva propiedad
          </Link>
        }
      />

      {resolvedSearchParams.eliminada === "1" && (
        <FormNotice>Propiedad eliminada.</FormNotice>
      )}
      {notice && <FormAlert>{notice}</FormAlert>}

      <PropertyStatusTabs filters={filters} counts={counts} />

      <PropertyFilters
        filters={filters}
        neighborhoods={neighborhoods}
        activeFilterCount={countSecondaryFilters(filters)}
      />

      <PropertyList
        properties={items}
        hasActiveFilters={hasActiveFilters(filters)}
        publicationAction={changePublicationAction}
      />

      {items.length > 0 && (
        <PropertyPagination
          page={page}
          totalPages={totalPages}
          total={total}
          filters={filters}
        />
      )}
    </div>
  );
}

import {
  buildPropertyListHref,
  type PropertyListFilters,
} from "@/lib/properties/list-params";
import Pagination from "@/components/admin/panel/Pagination/Pagination";

type PropertyPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  filters: PropertyListFilters;
};

/** Property list pagination, preserving filters in every href. */
export default function PropertyPagination({
  page,
  totalPages,
  total,
  filters,
}: PropertyPaginationProps) {
  return (
    <Pagination
      label="Paginación de propiedades"
      page={page}
      totalPages={totalPages}
      totalLabel={`${total} ${total === 1 ? "propiedad" : "propiedades"}`}
      previousHref={page > 1 ? buildPropertyListHref(filters, page - 1) : undefined}
      nextHref={page < totalPages ? buildPropertyListHref(filters, page + 1) : undefined}
    />
  );
}

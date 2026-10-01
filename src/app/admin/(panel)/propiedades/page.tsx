import PageHeader from "@/components/admin/panel/PageHeader/PageHeader";

/**
 * `/admin/propiedades` — property list (feature 6). T2 only wires the route
 * and its `PageHeader`; T3 fills in the filters, pagination, and the
 * card/table list.
 */
export default function AdminPropertiesPage() {
  return <PageHeader title="Propiedades" />;
}

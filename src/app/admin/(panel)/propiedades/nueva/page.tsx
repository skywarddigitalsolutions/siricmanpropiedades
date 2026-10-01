import Link from "next/link";
import { listNeighborhoods } from "@/lib/api/properties";
import PageHeader from "@/components/admin/panel/PageHeader/PageHeader";
import PropertyForm from "@/components/admin/properties/PropertyForm/PropertyForm";
import { createPropertyAction } from "./actions";
import styles from "../editor.module.css";

/** `/admin/propiedades/nueva` — create a draft property (feature 6 T4). */
export default async function NewPropertyPage() {
  const neighborhoods = await listNeighborhoods();

  return (
    <div className={styles.page}>
      <Link href="/admin/propiedades" className={styles.backLink}>
        ← Volver al listado
      </Link>
      <PageHeader
        title="Nueva propiedad"
        description="Se guarda como borrador. Después vas a poder cargar las fotos y publicarla."
      />
      <PropertyForm
        mode="create"
        action={createPropertyAction}
        neighborhoods={neighborhoods}
      />
    </div>
  );
}

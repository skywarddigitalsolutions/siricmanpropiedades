import Link from "next/link";
import { listNeighborhoods } from "@/lib/api/properties";
import PageHeader from "@/components/admin/panel/PageHeader/PageHeader";
import PropertyForm from "@/components/admin/properties/PropertyForm/PropertyForm";
import PropertyStepper from "@/components/admin/properties/PropertyStepper/PropertyStepper";
import { createPropertyAction } from "./actions";
import styles from "../editor.module.css";

/** `/admin/propiedades/nueva` — step 1 of the guided flow; saves the draft and continues to photos (feature 16 T3). */
export default async function NewPropertyPage() {
  const neighborhoods = await listNeighborhoods();

  return (
    <div className={styles.page}>
      <Link href="/admin/propiedades" className={styles.backLink}>
        ← Volver al listado
      </Link>
      <PageHeader
        title="Nueva propiedad"
        description="Cargá los datos principales: se guarda como borrador y seguís con las fotos."
      />
      <PropertyStepper current="datos" />
      <PropertyForm
        mode="create"
        step="datos"
        action={createPropertyAction}
        neighborhoods={neighborhoods}
      />
    </div>
  );
}

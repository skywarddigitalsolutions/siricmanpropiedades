import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import {
  getProperty,
  listNeighborhoods,
  type PropertyDetail,
} from "@/lib/api/properties";
import { canDeleteProperty } from "@/lib/properties/lifecycle";
import { toFormValues } from "@/lib/properties/property-form";
import { getCurrentUser, getSessionToken } from "@/lib/session/dal";
import { handleSessionError } from "@/lib/session/session-error";
import FormNotice from "@/components/admin/forms/FormNotice/FormNotice";
import PageHeader from "@/components/admin/panel/PageHeader/PageHeader";
import DealStatusBadge from "@/components/admin/properties/DealStatusBadge/DealStatusBadge";
import PropertyForm from "@/components/admin/properties/PropertyForm/PropertyForm";
import PropertyImagesManager from "@/components/admin/properties/PropertyImagesManager/PropertyImagesManager";
import PropertyStatusPanel from "@/components/admin/properties/PropertyStatusPanel/PropertyStatusPanel";
import PublicationStatusBadge from "@/components/admin/properties/PublicationStatusBadge/PublicationStatusBadge";
import { updatePropertyAction } from "./actions";
import {
  deleteImageAction,
  reorderImagesAction,
  uploadImageAction,
} from "./image-actions";
import {
  changeDealStatusAction,
  changePublicationAction,
  deletePropertyAction,
} from "./lifecycle-actions";
import styles from "../editor.module.css";

type EditPropertyPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function loadProperty(token: string, id: string): Promise<PropertyDetail> {
  try {
    return await getProperty(token, id);
  } catch (error) {
    // 400 = malformed id (the back validates UUIDs), 404 = unknown id.
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
      notFound();
    }
    handleSessionError(error);
  }
}

/**
 * `/admin/propiedades/[id]` — property editor (feature 6). Sections: data form
 * (T4), status and actions (T5), photos (T6).
 */
export default async function EditPropertyPage({
  params,
  searchParams,
}: EditPropertyPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const token = await getSessionToken();
  const [property, neighborhoods, user] = await Promise.all([
    loadProperty(token, id),
    listNeighborhoods(),
    getCurrentUser(),
  ]);
  const isAdmin = user.roles.includes("admin");

  const notice =
    query.creada === "1"
      ? "Propiedad creada como borrador. Cargá las fotos y publicala cuando esté lista."
      : query.guardada === "1"
        ? "Cambios guardados."
        : undefined;

  return (
    <div className={styles.page}>
      <Link href="/admin/propiedades" className={styles.backLink}>
        ← Volver al listado
      </Link>
      <PageHeader title={property.title} description={`Código ${property.code}`} />
      <div className={styles.badges}>
        <PublicationStatusBadge status={property.publicationStatus} />
        <DealStatusBadge status={property.dealStatus} />
      </div>

      {notice && <FormNotice>{notice}</FormNotice>}

      <section aria-labelledby="property-status-heading" className={styles.section}>
        <h2 id="property-status-heading" className={styles.sectionTitle}>
          Estado y acciones
        </h2>
        <PropertyStatusPanel
          publicationStatus={property.publicationStatus}
          dealStatus={property.dealStatus}
          operation={property.operation}
          canDelete={canDeleteProperty(user.roles, property)}
          showArchiveHint={isAdmin && property.firstPublishedAt !== null}
          publicationAction={changePublicationAction.bind(null, property.id)}
          dealStatusAction={changeDealStatusAction.bind(null, property.id)}
          deleteAction={deletePropertyAction.bind(null, property.id)}
        />
      </section>

      <section aria-labelledby="property-photos-heading" className={styles.section}>
        <h2 id="property-photos-heading" className={styles.sectionTitle}>
          Fotos
        </h2>
        <PropertyImagesManager
          images={property.images}
          uploadAction={uploadImageAction.bind(null, property.id)}
          reorderAction={reorderImagesAction.bind(null, property.id)}
          deleteAction={deleteImageAction.bind(null, property.id)}
        />
      </section>

      <section aria-labelledby="property-data-heading" className={styles.section}>
        <h2 id="property-data-heading" className={styles.sectionTitle}>
          Datos de la propiedad
        </h2>
        <PropertyForm
          mode="edit"
          action={updatePropertyAction.bind(null, property.id)}
          neighborhoods={neighborhoods}
          initialValues={toFormValues(property)}
        />
      </section>
    </div>
  );
}

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
import { computeReadiness } from "@/lib/properties/readiness";
import { parseStep } from "@/lib/properties/steps";
import { getCurrentUser, getSessionToken } from "@/lib/session/dal";
import { handleSessionError } from "@/lib/session/session-error";
import AutoHideNotice from "@/components/admin/forms/AutoHideNotice/AutoHideNotice";
import PageHeader from "@/components/admin/panel/PageHeader/PageHeader";
import DealStatusBadge from "@/components/admin/properties/DealStatusBadge/DealStatusBadge";
import PropertyForm from "@/components/admin/properties/PropertyForm/PropertyForm";
import PropertyImagesManager from "@/components/admin/properties/PropertyImagesManager/PropertyImagesManager";
import PropertyStepper from "@/components/admin/properties/PropertyStepper/PropertyStepper";
import StepNav from "@/components/admin/properties/StepNav/StepNav";
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
 * `/admin/propiedades/[id]` — guided property editor (feature 6, reworked in
 * feature 16 T3). `?paso=` picks the step: datos, fotos, descripcion or
 * vista-previa (publication). Each form step saves only its own fields; the
 * stepper allows free navigation.
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
  const step = parseStep(query.paso);
  const readiness = computeReadiness({
    imageCount: property.images.length,
    description: property.description,
    price: property.price,
  });

  const notice =
    query.creada === "1"
      ? "Borrador creado. Ahora cargá las fotos; después sumá la descripción y publicá."
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

      {notice && <AutoHideNotice>{notice}</AutoHideNotice>}

      <PropertyStepper current={step} propertyId={property.id} />

      {step === "datos" && (
        <section aria-labelledby="property-data-heading" className={styles.section}>
          <h2 id="property-data-heading" className={styles.sectionTitle}>
            Datos de la propiedad
          </h2>
          <PropertyForm
            mode="edit"
            step="datos"
            action={updatePropertyAction.bind(null, property.id, "datos")}
            neighborhoods={neighborhoods}
            initialValues={toFormValues(property)}
          />
        </section>
      )}

      {step === "fotos" && (
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
      )}

      {step === "descripcion" && (
        <section aria-labelledby="property-extras-heading" className={styles.section}>
          <h2 id="property-extras-heading" className={styles.sectionTitle}>
            Descripción y extras
          </h2>
          <PropertyForm
            mode="edit"
            step="extras"
            action={updatePropertyAction.bind(null, property.id, "extras")}
            neighborhoods={neighborhoods}
            initialValues={toFormValues(property)}
          />
        </section>
      )}

      {step === "vista-previa" && (
        <section aria-labelledby="property-status-heading" className={styles.section}>
          <h2 id="property-status-heading" className={styles.sectionTitle}>
            Publicación y estado
          </h2>
          <Link
            href={`/admin/propiedades/${property.id}/vista-previa`}
            className={styles.previewLink}
          >
            Abrir la vista previa: así la verán tus clientes
          </Link>
          <PropertyStatusPanel
            propertyId={property.id}
            readiness={readiness}
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
      )}

      <StepNav propertyId={property.id} current={step} />
    </div>
  );
}

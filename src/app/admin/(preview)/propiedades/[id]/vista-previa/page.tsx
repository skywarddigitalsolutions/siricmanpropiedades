import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { getProperty, type PropertyDetail } from "@/lib/api/properties";
import { computeReadiness } from "@/lib/properties/readiness";
import { toPublicPropertyDetail } from "@/lib/properties/preview";
import { getSessionToken } from "@/lib/session/dal";
import { handleSessionError } from "@/lib/session/session-error";
import { publicSiteHref } from "@/lib/site-url";
import PropertyDetailView from "@/components/site/detail/PropertyDetailView/PropertyDetailView";
import PreviewBanner from "@/components/admin/properties/PreviewBanner/PreviewBanner";
import { changePublicationAction } from "@/app/admin/(panel)/propiedades/[id]/lifecycle-actions";

// Never indexed, like every admin page (the admin layout says so too).
export const metadata: Metadata = {
  title: "Vista previa",
  robots: { index: false, follow: false },
};

type PreviewPageProps = { params: Promise<{ id: string }> };

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
 * `/admin/propiedades/[id]/vista-previa` (feature 16 T5): the public listing
 * rendered from the admin data, so what is published matches what was seen.
 * Lives outside the `(panel)` shell on purpose — the detail view brings its
 * own `<main>` and chrome-free layout — and the inquiry form is not rendered.
 */
export default async function PreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;
  const token = await getSessionToken();
  const property = await loadProperty(token, id);
  const readiness = computeReadiness({
    imageCount: property.images.length,
    description: property.description,
    price: property.price,
  });

  return (
    <>
      <PreviewBanner
        propertyId={property.id}
        publicationStatus={property.publicationStatus}
        readiness={readiness}
        publicationAction={changePublicationAction.bind(null, property.id)}
        siteHref={publicSiteHref(`/propiedades/${property.slug}`)}
      />
      <PropertyDetailView property={toPublicPropertyDetail(property)} preview />
    </>
  );
}

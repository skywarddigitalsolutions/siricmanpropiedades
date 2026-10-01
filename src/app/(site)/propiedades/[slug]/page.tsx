import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ApiError } from "@/lib/api/client";
import { getPublicProperty } from "@/lib/api/public-catalog";
import { OPERATION_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/properties/labels";
import { propertyPriceLabel, propertySpecs } from "@/lib/public/property-view";
import { propertyJsonLd } from "@/lib/public/structured-data";
import type { PublicPropertyDetail } from "@/lib/public/types";
import { getSiteUrl } from "@/lib/site-url";
import JsonLd from "@/components/site/JsonLd/JsonLd";
import PropertyDetailView from "@/components/site/detail/PropertyDetailView/PropertyDetailView";

export const dynamic = "force-dynamic";

type PropertyPageProps = { params: Promise<{ slug: string }> };

/** One fetch per request, shared by `generateMetadata` and the page. */
const loadProperty = cache(async (slug: string): Promise<PublicPropertyDetail> => {
  try {
    return await getPublicProperty(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
});

/** "Departamento en venta en Palermo · 78 m² totales · 3 ambientes …" — for search snippets. */
function summary(property: PublicPropertyDetail): string {
  const operation = OPERATION_LABELS[property.operation].toLowerCase();
  const head = `${PROPERTY_TYPE_LABELS[property.type]} en ${operation} en ${property.neighborhood.name}`;
  const specs = propertySpecs(property).map((spec) => spec.label);
  const text = [head, ...specs, propertyPriceLabel(property)].join(" · ");
  const extra = property.description?.replace(/\s+/g, " ").trim();
  const full = extra ? `${text}. ${extra}` : text;
  return full.length > 160 ? `${full.slice(0, 157).trimEnd()}…` : full;
}

export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  const property = await loadProperty((await params).slug);
  const title = `${property.title} · ${propertyPriceLabel(property)}`;
  const description = summary(property);
  const cover = property.images[0];
  return {
    title,
    description,
    alternates: { canonical: `/propiedades/${property.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/propiedades/${property.slug}`,
      images: cover ? [{ url: cover.url, width: cover.width, height: cover.height }] : undefined,
    },
  };
}

/** `/propiedades/[slug]` — property page. */
export default async function PropertyPage({ params }: PropertyPageProps) {
  const property = await loadProperty((await params).slug);
  return (
    <>
      <JsonLd data={propertyJsonLd(property, getSiteUrl())} />
      <PropertyDetailView property={property} />
    </>
  );
}

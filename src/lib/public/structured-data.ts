import { WHATSAPP_PHONE } from "@/lib/whatsapp";
import type { PublicPropertyDetail } from "./types";

/**
 * schema.org JSON-LD for search engines. A listing is a `RealEstateListing`
 * with an `Offer` (sale or lease); the street address is included only when
 * the owner made it public, as on the page itself.
 */
export function propertyJsonLd(property: PublicPropertyDetail, siteUrl: string) {
  const address: Record<string, string> = {
    "@type": "PostalAddress",
    ...(property.address ? { streetAddress: property.address } : {}),
    addressLocality: property.neighborhood.name,
    addressRegion: "CABA",
    addressCountry: "AR",
  };
  const available = property.dealStatus === "available" || property.dealStatus === "reserved";

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    ...(property.description ? { description: property.description } : {}),
    url: `${siteUrl}/propiedades/${property.slug}`,
    ...(property.publishedAt ? { datePosted: property.publishedAt } : {}),
    image: property.images.map((image) => image.url),
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: property.currency,
      businessFunction:
        property.operation === "sale"
          ? "http://purl.org/goodrelations/v1#Sell"
          : "http://purl.org/goodrelations/v1#LeaseOut",
      availability: available ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    },
    contentLocation: { "@type": "Place", address },
  };
}

export function agencyJsonLd(siteUrl: string) {
  return { "@context": "https://schema.org", ...agency(siteUrl) };
}

/** The agency itself, reused as the provider of its services. */
function agency(siteUrl: string) {
  return {
    "@type": "RealEstateAgent",
    name: "Siricman Propiedades",
    url: siteUrl,
    logo: `${siteUrl}/brand/logo-full.png`,
    telephone: `+${WHATSAPP_PHONE}`,
    areaServed: "Ciudad Autónoma de Buenos Aires",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Ciudad Autónoma de Buenos Aires",
      addressCountry: "AR",
    },
  };
}

/** The appraisal page as a `Service` offered by the agency (nested, without its own @context). */
export function appraisalServiceJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Tasación de propiedades",
    name: "Tasación y venta de propiedades en CABA",
    url: `${siteUrl}/vender`,
    areaServed: "Ciudad Autónoma de Buenos Aires",
    provider: agency(siteUrl),
  };
}

/** JSON for a `<script type="application/ld+json">`; `<` is escaped so data can't close the tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

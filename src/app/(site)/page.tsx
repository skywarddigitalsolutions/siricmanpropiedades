import { getPublicNeighborhoods, listPublicProperties } from "@/lib/api/public-catalog";
import type { Operation } from "@/lib/properties/enums";
import { SHOWCASE_SIZE, needsFallback, pickShowcase } from "@/lib/public/featured";
import { agencyJsonLd } from "@/lib/public/structured-data";
import type { PublicNeighborhood, PublicPropertyListItem } from "@/lib/public/types";
import { getSiteUrl } from "@/lib/site-url";
import JsonLd from "@/components/site/JsonLd/JsonLd";
import FeaturedSection from "@/components/site/home/FeaturedSection/FeaturedSection";
import HeroSearch from "@/components/site/home/HeroSearch/HeroSearch";
import {
  AppraisalCta,
  ServicesGrid,
  TypeChips,
} from "@/components/site/home/HomeSections/HomeSections";

// Rendered per request (the catalog is cached for 60 s by the data layer), so
// the Docker build never needs the API.
export const dynamic = "force-dynamic";

/** Featured properties of an operation, completed with its latest published ones. */
async function loadShowcase(operation: Operation): Promise<PublicPropertyListItem[]> {
  const featured = await listPublicProperties({ operation, featured: true, limit: SHOWCASE_SIZE });
  if (!needsFallback(featured.items.length)) return pickShowcase(featured.items, []);
  const latest = await listPublicProperties({ operation, limit: SHOWCASE_SIZE });
  return pickShowcase(featured.items, latest.items);
}

/**
 * Home. The catalog is optional here: if the API is down the page still
 * renders the search and the institutional sections, and a failing
 * operation only hides its own section.
 */
export default async function Home() {
  const [sale, rent, neighborhoods] = await Promise.allSettled([
    loadShowcase("sale"),
    loadShowcase("rent"),
    getPublicNeighborhoods(),
  ]);
  const barrios: PublicNeighborhood[] =
    neighborhoods.status === "fulfilled" ? neighborhoods.value : [];

  return (
    <main>
      <JsonLd data={agencyJsonLd(getSiteUrl())} />
      <HeroSearch neighborhoods={barrios} />
      <TypeChips />
      <FeaturedSection
        operation="sale"
        eyebrow="En venta"
        title="Destacadas en venta"
        subtitle="Propiedades seleccionadas para comprar en CABA."
        properties={sale.status === "fulfilled" ? sale.value : []}
      />
      <FeaturedSection
        operation="rent"
        eyebrow="En alquiler"
        title="Destacadas en alquiler"
        subtitle="Opciones para alquilar con contratos claros."
        properties={rent.status === "fulfilled" ? rent.value : []}
      />
      <ServicesGrid />
      <AppraisalCta />
    </main>
  );
}

import { listPublicProperties } from "@/lib/api/public-catalog";
import type { Operation } from "@/lib/properties/enums";
import { SHOWCASE_SIZE, needsFallback, pickShowcase } from "@/lib/public/featured";
import { agencyJsonLd } from "@/lib/public/structured-data";
import type { PublicPropertyListItem } from "@/lib/public/types";
import { getSiteUrl } from "@/lib/site-url";
import JsonLd from "@/components/site/JsonLd/JsonLd";
import FeaturedSection from "@/components/site/home/FeaturedSection/FeaturedSection";
import OwnerHero from "@/components/site/home/OwnerHero/OwnerHero";
import OwnerProcess from "@/components/site/home/OwnerProcess/OwnerProcess";
import BuyerSearch from "@/components/site/home/BuyerSearch/BuyerSearch";
import { ServicesGrid } from "@/components/site/home/HomeSections/HomeSections";
import AboutTeaser from "@/components/site/home/AboutTeaser/AboutTeaser";
import ManagementSection from "@/components/site/home/ManagementSection/ManagementSection";

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
 * renders the hero and the institutional sections, and a failing
 * operation only hides its own section.
 */
export default async function Home() {
  const [sale, rent] = await Promise.allSettled([loadShowcase("sale"), loadShowcase("rent")]);

  return (
    <main>
      <JsonLd data={agencyJsonLd(getSiteUrl())} />
      <OwnerHero />
      <OwnerProcess />
      <BuyerSearch />
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
      <ManagementSection />
      <AboutTeaser />
    </main>
  );
}

import { getPublicNeighborhoods, listPublicProperties } from "@/lib/api/public-catalog";
import { agencyJsonLd } from "@/lib/public/structured-data";
import type { PublicNeighborhood, PublicPropertyListItem } from "@/lib/public/types";
import { getSiteUrl } from "@/lib/site-url";
import JsonLd from "@/components/site/JsonLd/JsonLd";
import HeroSearch from "@/components/site/home/HeroSearch/HeroSearch";
import {
  AppraisalCta,
  PersonalQuote,
  PropertyCarousel,
  ServicesGrid,
  TypeChips,
} from "@/components/site/home/HomeSections/HomeSections";

// Rendered per request (the catalog is cached for 60 s by the data layer), so
// the Docker build never needs the API.
export const dynamic = "force-dynamic";

const CAROUSEL_SIZE = 6;

/** Featured properties, or the newest ones while nothing is featured. */
async function loadCarousel(): Promise<{ title: string; items: PublicPropertyListItem[] }> {
  const featured = await listPublicProperties({ featured: true, limit: CAROUSEL_SIZE });
  if (featured.items.length > 0) return { title: "Destacadas", items: featured.items };
  const newest = await listPublicProperties({ limit: CAROUSEL_SIZE });
  return { title: "Recién publicadas", items: newest.items };
}

/**
 * Home. The catalog is optional here: if the API is down the page still
 * renders the search and the institutional sections.
 */
export default async function Home() {
  const [carousel, neighborhoods] = await Promise.allSettled([
    loadCarousel(),
    getPublicNeighborhoods(),
  ]);
  const barrios: PublicNeighborhood[] =
    neighborhoods.status === "fulfilled" ? neighborhoods.value : [];
  const showcase =
    carousel.status === "fulfilled" && carousel.value.items.length > 0 ? carousel.value : null;

  return (
    <main>
      <JsonLd data={agencyJsonLd(getSiteUrl())} />
      <HeroSearch neighborhoods={barrios} />
      <TypeChips />
      {showcase && <PropertyCarousel title={showcase.title} properties={showcase.items} />}
      <ServicesGrid />
      <PersonalQuote />
      <AppraisalCta />
    </main>
  );
}

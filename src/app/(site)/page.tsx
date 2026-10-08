import { listPublicProperties } from "@/lib/api/public-catalog";
import { SHOWCASE_SIZE, needsFallback, pickShowcase } from "@/lib/public/featured";
import { agencyJsonLd } from "@/lib/public/structured-data";
import type { PublicPropertyListItem } from "@/lib/public/types";
import { getSiteUrl } from "@/lib/site-url";
import JsonLd from "@/components/site/JsonLd/JsonLd";
import FeaturedSection from "@/components/site/home/FeaturedSection/FeaturedSection";
import OwnerHero from "@/components/site/home/OwnerHero/OwnerHero";
import TrustStrip from "@/components/site/home/TrustStrip/TrustStrip";
import OwnerProcess from "@/components/site/home/OwnerProcess/OwnerProcess";
import WhySell from "@/components/site/home/WhySell/WhySell";
import SellerFaq from "@/components/site/home/SellerFaq/SellerFaq";
import ManagementSection from "@/components/site/home/ManagementSection/ManagementSection";
import ConsortiumBand from "@/components/site/home/ConsortiumBand/ConsortiumBand";
import BuyerSearch from "@/components/site/home/BuyerSearch/BuyerSearch";
import SellerCta from "@/components/site/home/SellerCta/SellerCta";

// Rendered per request (the catalog is cached for 60 s by the data layer), so
// the Docker build never needs the API.
export const dynamic = "force-dynamic";

/** Featured properties of any operation, completed with the latest published ones. */
async function loadShowcase(): Promise<PublicPropertyListItem[]> {
  const featured = await listPublicProperties({ featured: true, limit: SHOWCASE_SIZE });
  if (!needsFallback(featured.items.length)) return pickShowcase(featured.items, []);
  const latest = await listPublicProperties({ limit: SHOWCASE_SIZE });
  return pickShowcase(featured.items, latest.items);
}

/**
 * Home, written for owners who want to sell: hero, trust signals, selling
 * process, reasons, FAQ, then the secondary services (rental management and
 * consortiums), the buyer entry points and a closing call. The catalog is
 * optional: if the API is down the page still renders every other section,
 * and only the featured carousel is hidden.
 */
export default async function Home() {
  const [showcase] = await Promise.allSettled([loadShowcase()]);

  return (
    <main>
      <JsonLd data={agencyJsonLd(getSiteUrl())} />
      <OwnerHero />
      <TrustStrip />
      <OwnerProcess />
      <WhySell />
      <SellerFaq />
      <ManagementSection />
      <ConsortiumBand />
      <BuyerSearch />
      <FeaturedSection
        eyebrow="Destacadas"
        title="Propiedades destacadas"
        subtitle="Una selección de propiedades en venta y alquiler en CABA."
        properties={showcase.status === "fulfilled" ? showcase.value : []}
      />
      <SellerCta />
    </main>
  );
}

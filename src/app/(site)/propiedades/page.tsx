import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPublicNeighborhoods, listPublicProperties } from "@/lib/api/public-catalog";
import {
  EMPTY_SEARCH,
  buildSearchHref,
  canonicalHref,
  isCanonicalQuery,
  parseSearchParams,
  resultsSeo,
  resultsTitle,
  toApiFilters,
} from "@/lib/public/search-params";
import type { PublicNeighborhood, PublicPropertyListItem } from "@/lib/public/types";
import { WHATSAPP_PHONE, buildWhatsAppLink } from "@/lib/whatsapp";
import ActiveFilters from "@/components/site/results/ActiveFilters/ActiveFilters";
import PropertyCard from "@/components/site/PropertyCard/PropertyCard";
import ResultsFilterBar from "@/components/site/results/ResultsFilterBar/ResultsFilterBar";
import ResultsMessage from "@/components/site/results/ResultsMessage/ResultsMessage";
import ResultsPagination from "@/components/site/results/ResultsPagination/ResultsPagination";
import ResultsSort from "@/components/site/results/ResultsSort/ResultsSort";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

type ResultsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function neighborhoodsOrEmpty(): Promise<PublicNeighborhood[]> {
  try {
    return await getPublicNeighborhoods();
  } catch {
    return [];
  }
}

export async function generateMetadata({ searchParams }: ResultsPageProps): Promise<Metadata> {
  const state = parseSearchParams(await searchParams);
  const neighborhood = state.neighborhood
    ? (await neighborhoodsOrEmpty()).find((item) => item.slug === state.neighborhood)
    : undefined;
  const seo = resultsSeo(state, neighborhood?.name);
  return {
    title: seo.title,
    description: `${seo.title}: fotos, precios y detalles. Siricman Propiedades, asesoramiento personal en CABA.`,
    alternates: { canonical: canonicalHref(state) },
    robots: seo.indexable ? undefined : { index: false, follow: true },
  };
}

/** `/propiedades` — results. The URL is the whole state (see `search-params.ts`). */
export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const raw = await searchParams;
  const state = parseSearchParams(raw);
  if (!isCanonicalQuery(raw, state)) redirect(canonicalHref(state));

  const [neighborhoods, listing] = await Promise.all([
    neighborhoodsOrEmpty(),
    listPublicProperties(toApiFilters(state, PAGE_SIZE)).then(
      (result) => ({ ok: true as const, ...result }),
      () => ({ ok: false as const }),
    ),
  ]);

  if (listing.ok && state.code && listing.items.length === 1) {
    redirect(`/propiedades/${listing.items[0].slug}`);
  }

  const clearHref = buildSearchHref({ ...EMPTY_SEARCH, operation: state.operation });
  const askHref = buildWhatsAppLink(
    WHATSAPP_PHONE,
    "Hola Gabriel, estoy buscando una propiedad y no encontré lo que necesito en la web.",
  );

  return (
    <main className={styles.main}>
      <ResultsFilterBar state={state} neighborhoods={neighborhoods} />
      <section className={styles.results} aria-labelledby="results-title">
        <div className={styles.header}>
          <h1 id="results-title" className={styles.title}>
            {listing.ok ? resultsTitle(listing.total, state.operation) : "Propiedades"}
          </h1>
          <ResultsSort state={state} />
        </div>
        <ActiveFilters state={state} neighborhoods={neighborhoods} />
        <ResultsBody
          listing={listing}
          state={state}
          clearHref={clearHref}
          askHref={askHref}
        />
      </section>
    </main>
  );
}

type Listing = { ok: true; items: PublicPropertyListItem[]; total: number } | { ok: false };

function ResultsBody({
  listing,
  state,
  clearHref,
  askHref,
}: {
  listing: Listing;
  state: ReturnType<typeof parseSearchParams>;
  clearHref: string;
  askHref: string;
}) {
  if (!listing.ok) {
    return (
      <ResultsMessage
        title="No pudimos cargar las propiedades"
        actions={<Link href={canonicalHref(state)}>Reintentar</Link>}
      >
        Probá de nuevo en unos segundos o escribinos por WhatsApp.
      </ResultsMessage>
    );
  }

  if (listing.items.length === 0) {
    if (state.code) {
      return (
        <ResultsMessage
          title={`No encontramos la propiedad ${state.code}`}
          actions={<Link href="/propiedades">Ver todas las propiedades</Link>}
        >
          Revisá el código o escribinos y te ayudamos a encontrarla.
        </ResultsMessage>
      );
    }
    return (
      <ResultsMessage
        title="Sin resultados con esos filtros"
        actions={
          <>
            <Link href={clearHref}>Limpiar filtros</Link>
            <a href={askHref} target="_blank" rel="noopener noreferrer">
              Contanos qué buscás
            </a>
          </>
        }
      >
        Contanos qué buscás por WhatsApp y te avisamos si ingresa algo similar.
      </ResultsMessage>
    );
  }

  return (
    <>
      <ul className={styles.grid}>
        {listing.items.map((property) => (
          <li key={property.id}>
            <PropertyCard property={property} headingLevel={2} />
          </li>
        ))}
      </ul>
      <ResultsPagination state={state} totalPages={Math.ceil(listing.total / PAGE_SIZE)} />
    </>
  );
}

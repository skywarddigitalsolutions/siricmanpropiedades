import type { MetadataRoute } from "next";
import { listPublicProperties } from "@/lib/api/public-catalog";
import type { PublicPropertyListItem } from "@/lib/public/types";
import { absoluteUrl } from "@/lib/site-url";

// Built per request (cached data), so the Docker build never needs the API.
export const dynamic = "force-dynamic";

const PAGE = 50;

async function allPublished(): Promise<PublicPropertyListItem[]> {
  const items: PublicPropertyListItem[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const page = await listPublicProperties({ limit: PAGE, offset });
    items.push(...page.items);
    if (page.items.length === 0 || items.length >= page.total) return items;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const landings: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/propiedades"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/propiedades?operacion=venta"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/propiedades?operacion=alquiler"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/contacto"), changeFrequency: "yearly", priority: 0.5 },
  ];

  let properties: PublicPropertyListItem[] = [];
  try {
    properties = await allPublished();
  } catch {
    // Without the catalog, still publish the landing pages.
  }

  return [
    ...landings,
    ...properties.map((property) => ({
      url: absoluteUrl(`/propiedades/${property.slug}`),
      ...(property.publishedAt ? { lastModified: property.publishedAt } : {}),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}

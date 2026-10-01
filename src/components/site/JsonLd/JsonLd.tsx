import { serializeJsonLd } from "@/lib/public/structured-data";

/** Structured data for search engines; the payload is escaped by `serializeJsonLd`. */
export default function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

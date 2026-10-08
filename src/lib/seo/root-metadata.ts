import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

const SITE_NAME = "Siricman Propiedades";
const DEFAULT_TITLE = "Vendé tu propiedad en CABA";
const DESCRIPTION =
  "Vendé tu propiedad en CABA con asesoramiento profesional: tasación, plan de venta y acompañamiento hasta la escritura, con trato directo con un corredor matriculado.";

/** Site-wide defaults; pages set their own title (inserted in the template) and canonical. */
export function rootMetadata(): Metadata {
  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: `${DEFAULT_TITLE} | ${SITE_NAME}`,
      template: `%s | ${SITE_NAME}`,
    },
    description: DESCRIPTION,
    openGraph: {
      siteName: SITE_NAME,
      locale: "es_AR",
      type: "website",
      description: DESCRIPTION,
    },
  };
}

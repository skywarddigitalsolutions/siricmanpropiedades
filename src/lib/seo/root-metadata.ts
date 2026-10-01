import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

const SITE_NAME = "Siricman Propiedades";
const DESCRIPTION =
  "Venta y alquiler de propiedades en CABA, con asesoramiento personal de principio a fin.";

/** Site-wide defaults; pages set their own title (inserted in the template) and canonical. */
export function rootMetadata(): Metadata {
  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: `${SITE_NAME} | Venta y alquiler en CABA`,
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

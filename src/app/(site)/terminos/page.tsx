import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/site/legal/LegalPage/LegalPage";
import { CONTACT_EMAIL } from "@/lib/contact";

const TITLE = "Términos y condiciones";
const DESCRIPTION =
  "Condiciones de uso del sitio de Siricman Propiedades: información de las propiedades, precios, fotos y ley aplicable.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/terminos" },
  openGraph: { type: "website", title: TITLE, description: DESCRIPTION, url: "/terminos" },
};

const SECTIONS: LegalSection[] = [
  {
    heading: "Uso del sitio",
    content: [
      "Al navegar este sitio aceptás estos términos. El sitio está pensado para que puedas conocer las propiedades que ofrece Siricman Propiedades y ponerte en contacto con nosotros. Te pedimos usarlo de buena fe y no intentar alterar su funcionamiento.",
    ],
  },
  {
    heading: "Información de las propiedades",
    content: [
      "La información publicada (superficies, ambientes, características, estado y disponibilidad) es orientativa y puede cambiar sin previo aviso. Una propiedad puede dejar de estar disponible en cualquier momento.",
      "Los precios son de referencia, pueden modificarse y no constituyen una oferta vinculante hasta que se formalice la operación por escrito.",
      "Las fotografías son ilustrativas y pueden no reflejar el estado actual del inmueble. Te recomendamos coordinar una visita antes de tomar una decisión.",
    ],
  },
  {
    heading: "Enlaces a terceros",
    content: [
      "El sitio puede incluir enlaces o mapas de terceros (por ejemplo redes sociales o servicios de mapas). No controlamos esos sitios y no somos responsables por su contenido ni por sus políticas.",
    ],
  },
  {
    heading: "Limitación de responsabilidad",
    content: [
      "Hacemos lo posible por mantener la información actualizada, pero no garantizamos que esté libre de errores u omisiones. Siricman Propiedades no responde por daños derivados del uso del sitio o de la información publicada.",
    ],
  },
  {
    heading: "Datos personales",
    content: [
      <>
        El tratamiento de los datos que nos envíes se rige por nuestra{" "}
        <Link href="/privacidad">política de privacidad</Link>.
      </>,
    ],
  },
  {
    heading: "Ley aplicable",
    content: [
      "Estos términos se rigen por las leyes de la República Argentina. Para cualquier controversia serán competentes los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.",
      <>
        Si tenés consultas, escribinos a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </>,
    ],
  },
];

/** `/terminos` — terms of use of the public site. */
export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="LEGALES"
      title={TITLE}
      updated="octubre de 2026"
      intro="Estas son las condiciones generales para usar el sitio de Siricman Propiedades."
      sections={SECTIONS}
    />
  );
}

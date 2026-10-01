import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/site/legal/LegalPage/LegalPage";
import { CONTACT_EMAIL } from "@/lib/contact";

const TITLE = "Política de privacidad";
const DESCRIPTION =
  "Cómo Siricman Propiedades trata los datos personales que dejás en sus formularios, y cómo ejercer tus derechos.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/privacidad" },
  openGraph: { type: "website", title: TITLE, description: DESCRIPTION, url: "/privacidad" },
};

const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

const SECTIONS: LegalSection[] = [
  {
    heading: "Responsable del tratamiento",
    content: [
      "Siricman Propiedades, con domicilio en la Ciudad Autónoma de Buenos Aires, Argentina, es la responsable de los datos personales que recibe a través de este sitio.",
    ],
  },
  {
    heading: "Datos que recopilamos",
    content: [
      "Solo recopilamos los datos que vos nos enviás al completar los formularios de contacto, de consulta por una propiedad o de tasación:",
      <ul key="data">
        <li>Nombre.</li>
        <li>Teléfono o correo electrónico.</li>
        <li>El mensaje que escribas.</li>
        <li>
          En el caso de las tasaciones, los datos de la propiedad (tipo, dirección, características y
          operación de interés).
        </li>
      </ul>,
      "No guardamos tu dirección IP ni creamos perfiles sobre vos.",
    ],
  },
  {
    heading: "Para qué los usamos",
    content: [
      "Usamos tus datos únicamente para responder tu consulta o preparar la tasación que pediste, y para contactarte por el medio que nos indicaste. No los vendemos ni los cedemos a terceros con fines comerciales.",
    ],
  },
  {
    heading: "Cuánto tiempo los conservamos",
    content: [
      "Conservamos tus datos mientras sean necesarios para atender tu consulta y por un plazo razonable posterior para seguimiento. Pasado ese tiempo, los eliminamos o los anonimizamos.",
    ],
  },
  {
    heading: "Tus derechos",
    content: [
      "Según la Ley 25.326 de Protección de Datos Personales, tenés derecho a acceder a tus datos, rectificarlos, actualizarlos y pedir su supresión, en cualquier momento y sin costo.",
      <>Para ejercer estos derechos escribinos a {mail}.</>,
      "La Agencia de Acceso a la Información Pública, en su carácter de órgano de control de la Ley 25.326, tiene la atribución de atender las denuncias y reclamos que se interpongan por incumplimiento de las normas sobre protección de datos personales.",
    ],
  },
  {
    heading: "Contacto",
    content: [<>Si tenés dudas sobre esta política, escribinos a {mail}.</>],
  },
];

/** `/privacidad` — data protection notice (Ley 25.326). */
export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="LEGALES"
      title={TITLE}
      updated="octubre de 2026"
      intro="Cuidamos tus datos. Acá te contamos qué información recibimos, para qué la usamos y cómo podés ejercer tus derechos."
      sections={SECTIONS}
    />
  );
}

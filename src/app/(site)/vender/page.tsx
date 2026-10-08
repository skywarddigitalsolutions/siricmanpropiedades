import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Minus, Phone, Plus } from "lucide-react";
import AppraisalForm from "@/components/site/appraisal/AppraisalForm/AppraisalForm";
import WhatsAppIcon from "@/components/site/WhatsAppIcon/WhatsAppIcon";
import JsonLd from "@/components/site/JsonLd/JsonLd";
import { getPublicNeighborhoods } from "@/lib/api/public-catalog";
import { appraisalServiceJsonLd } from "@/lib/public/structured-data";
import { getSiteUrl } from "@/lib/site-url";
import { OFFICE_HOURS, PHONE_DISPLAY, PHONE_HREF } from "@/lib/contact";
import { WHATSAPP_SELLER_MESSAGE, WHATSAPP_PHONE, buildWhatsAppLink } from "@/lib/whatsapp";
import { sendAppraisalAction } from "./actions";
import styles from "./page.module.css";

// Rendered per request so a build without the API never bakes in an empty
// barrio list; the list itself comes from the catalog's 1h data cache.
export const dynamic = "force-dynamic";

const TITLE = "Vendé tu propiedad";
const DESCRIPTION =
  "Vendé tu propiedad en CABA con Gabriel Siricman, corredor inmobiliario matriculado: tasación profesional, plan de venta, difusión y acompañamiento hasta la escritura.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/vender" },
  openGraph: { type: "website", title: TITLE, description: DESCRIPTION, url: "/vender" },
};

/** What happens after the request is sent. */
const STEPS = [
  { title: "Te contactamos", text: "Coordinamos la visita y conocemos tu propiedad." },
  { title: "Recibís la tasación", text: "Un informe con el valor sugerido y sus fundamentos." },
  { title: "Definimos el plan", text: "Si decidís avanzar, armamos juntos el plan de venta." },
];

/** Owner doubts answered after the form (copy confirmed by the agency). */
const FAQ = [
  {
    question: "¿Qué necesito tener a mano?",
    answer:
      "Con la dirección y algunos datos básicos alcanza para empezar. Si tenés la escritura, los planos y los últimos recibos de expensas y ABL, nos ayudan a afinar el valor.",
  },
  {
    question: "¿La tasación me obliga a vender con ustedes?",
    answer: "No. Te entregamos el informe y vos decidís si avanzás con nosotros.",
  },
  {
    question: "¿En qué se basa el valor sugerido?",
    answer:
      "En la visita a la propiedad y en la comparación con operaciones reales de la zona: ubicación, metros, estado y comodidades del edificio.",
  },
  {
    question: "¿Qué documentación necesito para vender?",
    answer:
      "Escritura, datos de los titulares, últimos impuestos y expensas pagos. Te ayudamos a reunir lo que falte.",
  },
  {
    question: "¿Tasan también para alquilar?",
    answer: (
      <>
        Sí. Elegí “Alquilar” en el formulario y te sugerimos un valor de alquiler según la zona y el
        estado de la propiedad. Si preferís que nos ocupemos del alquiler, conocé la{" "}
        <Link href="/administracion-de-alquileres">administración de alquileres</Link>.
      </>
    ),
  },
];

/**
 * Barrio names for the form's dropdown (cached by the catalog client). Best
 * effort: if the API fails the form still works, just without the barrio field.
 */
async function loadNeighborhoodNames(): Promise<string[]> {
  try {
    return (await getPublicNeighborhoods()).map((neighborhood) => neighborhood.name);
  } catch {
    return [];
  }
}

/**
 * WhatsApp, phone and hours. Rendered twice: in the desktop side column and
 * after the form on phones; CSS shows one, so each keeps its reading order.
 */
function ContactOptions({ placement }: { placement: "side" | "below" }) {
  return (
    <aside
      aria-label="Contacto directo"
      data-placement={placement}
      className={`${styles.contact} ${placement === "side" ? styles.contactSide : styles.contactBelow}`}
    >
      <ul className={styles.contactList}>
        <li>
          <a
            href={buildWhatsAppLink(WHATSAPP_PHONE, WHATSAPP_SELLER_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.contactLink}
          >
            <span className={styles.contactIcon} aria-hidden="true">
              <WhatsAppIcon size={18} />
            </span>
            <span className={styles.contactLabel}>
              Escribinos por WhatsApp
              <span className={styles.contactHint}>
                Con un mensaje listo para completar con los datos de tu propiedad.
              </span>
            </span>
          </a>
        </li>
        <li>
          <a href={PHONE_HREF} className={styles.contactLink}>
            <span className={styles.contactIcon} aria-hidden="true">
              <Phone size={18} />
            </span>
            {PHONE_DISPLAY}
          </a>
        </li>
        <li className={styles.contactItem}>
          <span className={styles.contactIcon} aria-hidden="true">
            <Clock size={18} />
          </span>
          {OFFICE_HOURS} · con cita previa
        </li>
      </ul>
    </aside>
  );
}

/** `/vender` — the seller landing: request form, what happens next and a direct contact. */
export default async function AppraisalPage() {
  const neighborhoods = await loadNeighborhoodNames();

  return (
    <main className={styles.main}>
      <JsonLd data={appraisalServiceJsonLd(getSiteUrl())} />
      <section className={styles.page}>
        {/* The sticky side column stops at the end of this block, before the questions. */}
        <div className={styles.split}>
          {/* Desktop: sticky side column (intro + contact). Phones: it dissolves into the flow. */}
          <div className={styles.side} data-side-column>
            <div className={styles.intro}>
              <span className={styles.eyebrow}>Vendé tu propiedad</span>
              <h1 className={styles.title}>Vendé tu propiedad con un corredor que te acompaña hasta la escritura</h1>
              <p className={styles.lead}>
                Empezamos por una tasación profesional: visitamos tu propiedad, la comparamos con
                operaciones reales de la zona y te proponemos un plan de venta a medida.
              </p>
            </div>
            <ContactOptions placement="side" />
          </div>

          <div className={styles.card}>
            <AppraisalForm action={sendAppraisalAction} neighborhoods={neighborhoods} />
          </div>

          <ol aria-label="Cómo sigue" className={styles.steps}>
            {STEPS.map(({ title, text }) => (
              <li key={title} className={styles.step}>
                <strong className={styles.stepTitle}>{title}</strong>
                <span className={styles.stepText}>{text}</span>
              </li>
            ))}
          </ol>

          <ContactOptions placement="below" />
        </div>

        <section aria-labelledby="appraisal-faq" className={styles.faq}>
          <span className={styles.eyebrow}>Preguntas frecuentes</span>
          <h2 id="appraisal-faq" className={styles.faqTitle}>
            Lo que preguntan los propietarios antes de vender
          </h2>
          <div className={styles.faqList}>
            {FAQ.map(({ question, answer }) => (
              <details key={question} className={styles.faqItem}>
                <summary className={styles.faqQuestion}>
                  {question}
                  <span className={styles.faqIcon} aria-hidden="true">
                    <Plus size={18} className={styles.faqPlus} />
                    <Minus size={18} className={styles.faqMinus} />
                  </span>
                </summary>
                <p className={styles.faqAnswer}>{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

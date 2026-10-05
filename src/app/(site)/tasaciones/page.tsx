import type { Metadata } from "next";
import AppraisalForm from "@/components/site/appraisal/AppraisalForm/AppraisalForm";
import WhatsAppIcon from "@/components/site/WhatsAppIcon/WhatsAppIcon";
import { OFFICE_HOURS, PHONE_DISPLAY, PHONE_HREF } from "@/lib/contact";
import { WHATSAPP_DEFAULT_MESSAGE, WHATSAPP_PHONE, buildWhatsAppLink } from "@/lib/whatsapp";
import { sendAppraisalAction } from "./actions";
import styles from "./page.module.css";

const DESCRIPTION =
  "Pedí la tasación de tu propiedad en CABA: visitamos, comparamos con operaciones reales de la zona y te armamos un informe con el valor sugerido y un plan de difusión.";

export const metadata: Metadata = {
  title: "Tasaciones",
  description: DESCRIPTION,
  alternates: { canonical: "/tasaciones" },
  openGraph: { type: "website", title: "Tasaciones", description: DESCRIPTION, url: "/tasaciones" },
};

const STEPS = [
  {
    title: "Contanos de tu propiedad",
    text: "Completá el formulario o escribinos por WhatsApp.",
  },
  {
    title: "Visita y análisis",
    text: "Comparamos con operaciones reales de la zona.",
  },
  {
    title: "Informe y estrategia",
    text: "Valor sugerido, fotos y plan de difusión.",
  },
];

/** `/tasaciones` — how an appraisal works and the request form. */
export default function AppraisalPage() {
  return (
    <main className={styles.main}>
      <section className={styles.page}>
        <div className={styles.intro}>
          <span className={styles.eyebrow}>VENDÉ O ALQUILÁ CON NOSOTROS</span>
          <h1 className={styles.title}>Tasamos tu propiedad y te acompañamos hasta la firma</h1>
        </div>

        <div className={styles.columns}>
          <div className={styles.aside}>
            <ol className={styles.steps} aria-label="Cómo funciona">
              {STEPS.map((step, index) => (
                <li key={step.title} className={styles.step}>
                  <span className={styles.stepNumber} aria-hidden="true">
                    {index + 1}
                  </span>
                  <span className={styles.stepText}>
                    <span className={styles.stepTitle}>{step.title}</span>
                    <span className={styles.stepBody}>{step.text}</span>
                  </span>
                </li>
              ))}
            </ol>

            <aside aria-label="Contacto directo" className={styles.contact}>
              <p className={styles.contactTitle}>¿Preferís hablarlo?</p>
              <a
                href={buildWhatsAppLink(WHATSAPP_PHONE, WHATSAPP_DEFAULT_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsapp}
              >
                <WhatsAppIcon size={18} aria-hidden="true" />
                Escribinos por WhatsApp
              </a>
              <a href={PHONE_HREF} className={styles.phone}>
                {PHONE_DISPLAY}
              </a>
              <p className={styles.hours}>{OFFICE_HOURS} · con cita previa</p>
            </aside>
          </div>

          <div className={styles.card}>
            <AppraisalForm action={sendAppraisalAction} />
          </div>
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import {
  ArrowRight,
  Check,
  FileText,
  House,
  Minus,
  Plus,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { BROKER_LICENSE } from "@/lib/contact";
import RentalManagementForm from "@/components/site/rental/RentalManagementForm/RentalManagementForm";
import WhatsAppIcon from "@/components/site/WhatsAppIcon/WhatsAppIcon";
import { WHATSAPP_PHONE, buildWhatsAppLink } from "@/lib/whatsapp";
import { sendRentalAction } from "./actions";
import styles from "./page.module.css";

const TITLE = "Administración de alquileres";
const DESCRIPTION =
  "Administración de alquileres en CABA: cobranza mensual, rendición de cuentas, ajustes de contrato, renovaciones y relación con el inquilino. Dejá tu alquiler en manos de un corredor matriculado.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/administracion-de-alquileres" },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: "/administracion-de-alquileres",
  },
};

const WHATSAPP_MESSAGE = "Hola Gabriel, quiero consultar por la administración de mi alquiler.";

const HIGHLIGHTS = [
  "Trato directo con Gabriel Siricman",
  "Rendición de cuentas mensual",
  `Corredor inmobiliario matriculado · ${BROKER_LICENSE}`,
];

/** What the administration covers, grouped by theme so it reads at a glance. */
const INCLUDE_GROUPS: { icon: LucideIcon; title: string; items: string[] }[] = [
  {
    icon: Wallet,
    title: "Cobranza",
    items: [
      "Cobro mensual del alquiler",
      "Rendición de cuentas con comprobantes",
      "Seguimiento de pagos atrasados",
    ],
  },
  {
    icon: FileText,
    title: "Contrato",
    items: ["Ajustes según el contrato", "Renovaciones y nuevos contratos", "Control de vencimientos"],
  },
  {
    icon: House,
    title: "Inquilino y propiedad",
    items: [
      "Atención de consultas y reclamos",
      "Coordinación de arreglos y mantenimiento",
      "Entrega y recepción de la propiedad",
    ],
  },
];

const STEPS = [
  { title: "Conversamos", text: "Nos contás sobre tu propiedad y el contrato vigente." },
  {
    title: "Te presentamos la propuesta",
    text: "Te explicamos cómo trabajamos y qué incluye la administración.",
  },
  {
    title: "Hacemos el traspaso",
    text: "Nos presentamos con el inquilino y ordenamos la documentación.",
  },
  { title: "Gestión mes a mes", text: "Cobramos, te rendimos cuentas y te mantenemos al tanto." },
];

const FAQ = [
  {
    question: "¿Puedo pasar a su administración con un contrato ya firmado?",
    answer:
      "Sí. Revisamos el contrato vigente y nos presentamos con tu inquilino para hacer el traspaso ordenado.",
  },
  {
    question: "¿Cómo me entero de lo que pasa con mi propiedad?",
    answer: "Todos los meses recibís la rendición de cuentas, y ante cualquier novedad te avisamos.",
  },
  {
    question: "¿Qué pasa si hay que hacer un arreglo?",
    answer: "Te consultamos antes de avanzar y coordinamos con proveedores de confianza.",
  },
  {
    question: "¿Cuánto cuesta la administración?",
    answer: "Depende de la propiedad y del contrato. Contanos tu caso y te pasamos una propuesta.",
  },
];

/** `/administracion-de-alquileres` — the rental management service and consultation form. */
export default function RentalManagementPage() {
  return (
    <main className={styles.main}>
      <div className={styles.band}>
        <section className={`${styles.inner} ${styles.hero}`}>
          <div className={styles.intro}>
            <span className={styles.eyebrow}>ADMINISTRACIÓN DE ALQUILERES</span>
            <h1 className={styles.title}>Tu propiedad alquilada, sin preocupaciones</h1>
            <p className={styles.lead}>
              Cobramos el alquiler, te rendimos cuentas todos los meses y nos ocupamos del inquilino,
              para que vos no tengas que hacerlo.
            </p>
            <div className={styles.actions}>
              <a href="#consulta" className={styles.primary}>
                Quiero que administren mi alquiler
                <ArrowRight aria-hidden size={18} />
              </a>
              <a
                href={buildWhatsAppLink(WHATSAPP_PHONE, WHATSAPP_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.secondary}
              >
                <WhatsAppIcon size={18} />
                Escribinos por WhatsApp
              </a>
            </div>
          </div>

          <aside aria-label="Datos de la administración" className={styles.panel}>
            <ul className={styles.highlights}>
              {HIGHLIGHTS.map((item) => (
                <li key={item} className={styles.highlight}>
                  <span className={styles.check} aria-hidden="true">
                    <Check size={16} strokeWidth={2.5} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </aside>
        </section>
      </div>

      <div className={styles.band}>
        <section aria-labelledby="rental-includes" className={`${styles.inner} ${styles.block}`}>
          <h2 id="rental-includes" className={styles.heading}>
            Qué incluye
          </h2>
          <ul className={styles.groups}>
            {INCLUDE_GROUPS.map(({ icon: Icon, title, items }) => (
              <li key={title} className={styles.group}>
                <span className={styles.includeIcon} aria-hidden="true">
                  <Icon size={18} />
                </span>
                <h3 className={styles.groupTitle}>{title}</h3>
                <ul className={styles.groupItems}>
                  {items.map((item) => (
                    <li key={item} className={styles.groupItem}>
                      <Check aria-hidden size={16} strokeWidth={2.5} className={styles.groupCheck} />
                      {item}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className={styles.band}>
        <section aria-label="Cómo trabajamos" className={`${styles.inner} ${styles.block}`}>
          <div className={`${styles.navy} ${styles.block}`}>
            <div>
              <span className={styles.eyebrow}>Cómo trabajamos</span>
              <h2 className={`${styles.heading} ${styles.processTitle}`}>
                Pasar tu alquiler a nuestra administración es simple
              </h2>
            </div>
            <ol className={styles.steps}>
              {STEPS.map((step, index) => (
                <li key={step.title} className={styles.step}>
                  <span className={styles.stepNumber} aria-hidden="true">
                    {index + 1}
                  </span>
                  <span className={styles.stepTitle}>{step.title}</span>
                  <span className={styles.stepText}>{step.text}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>

      <div className={styles.band}>
        <section className={styles.inner}>
          <div className={styles.later}>
            <div>
              <h2 className={styles.laterTitle}>¿Todavía no la alquilaste?</h2>
              <p className={styles.laterText}>
                También buscamos inquilinos y armamos el contrato. Después, si querés, seguimos
                administrándola.
              </p>
            </div>
            <a href="#consulta" className={styles.primary}>
              Consultanos
            </a>
          </div>
        </section>
      </div>

      <div className={styles.band}>
        <section aria-labelledby="rental-faq" className={`${styles.inner} ${styles.faq}`}>
          <h2 id="rental-faq" className={styles.faqTitle}>
            Preguntas frecuentes
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
      </div>

      <div className={styles.band}>
        <section
          id="consulta"
          aria-labelledby="rental-consulta"
          className={`${styles.inner} ${styles.proposalWrap}`}
        >
          <div className={`${styles.navy} ${styles.proposal}`}>
            <div className={styles.proposalText}>
              <span className={styles.eyebrow}>CONSULTA</span>
              <h2 id="rental-consulta" className={styles.proposalTitle}>
                Contanos de tu propiedad
              </h2>
              <p className={styles.proposalLead}>
                Dejanos los datos básicos y Gabriel se comunica con vos para conocer tu propiedad y
                armarte una propuesta.
              </p>
            </div>
            <div className={styles.card}>
              <RentalManagementForm action={sendRentalAction} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

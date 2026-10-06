import type { Metadata } from "next";
import {
  ArrowRight,
  Calculator,
  Check,
  HandCoins,
  MessageCircle,
  Minus,
  Plus,
  ReceiptText,
  Scale,
  ShieldCheck,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import ConsortiumForm from "@/components/site/consortium/ConsortiumForm/ConsortiumForm";
import WhatsAppIcon from "@/components/site/WhatsAppIcon/WhatsAppIcon";
import { WHATSAPP_PHONE, buildWhatsAppLink } from "@/lib/whatsapp";
import { sendConsortiumAction } from "./actions";
import styles from "./page.module.css";

const DESCRIPTION =
  "Administración de consorcios en CABA con más de 11 años de experiencia: liquidación de expensas, cobranza, proveedores, mantenimiento, asambleas y atención a propietarios. Pedí una propuesta.";

export const metadata: Metadata = {
  title: "Administración de consorcios",
  description: DESCRIPTION,
  alternates: { canonical: "/administracion-de-consorcios" },
  openGraph: {
    type: "website",
    title: "Administración de consorcios",
    description: DESCRIPTION,
    url: "/administracion-de-consorcios",
  },
};

const WHATSAPP_MESSAGE =
  "Hola Gabriel, quiero consultar por la administración de consorcios de mi edificio.";

const HIGHLIGHTS = [
  "Trato directo con Gabriel Siricman",
  "Cuentas claras para cada propietario",
  "Atención por WhatsApp y teléfono",
];

const INCLUDES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Calculator,
    title: "Liquidación de expensas",
    text: "Cálculo mensual claro y detallado, listo para que cada propietario entienda qué paga.",
  },
  {
    icon: HandCoins,
    title: "Cobranza y morosidad",
    text: "Seguimiento de los pagos y gestión ordenada de las deudas del consorcio.",
  },
  {
    icon: ReceiptText,
    title: "Pago a proveedores y servicios",
    text: "Control de facturas y pago puntual de servicios, personal y proveedores.",
  },
  {
    icon: Wrench,
    title: "Mantenimiento y reparaciones",
    text: "Relevamos el estado del edificio, pedimos presupuestos y coordinamos los trabajos.",
  },
  {
    icon: Users,
    title: "Asambleas y actas",
    text: "Convocatoria, organización y registro de cada asamblea, con sus actas al día.",
  },
  {
    icon: Scale,
    title: "Cumplimiento legal",
    text: "Gestión alineada con la Ley 941 y el Registro Público de Administradores de Consorcios de la Ciudad.",
  },
  {
    icon: ShieldCheck,
    title: "Seguros y matafuegos",
    text: "Seguimos los vencimientos de pólizas y la recarga de matafuegos del edificio.",
  },
  {
    icon: MessageCircle,
    title: "Atención a propietarios",
    text: "Un canal directo para reclamos, consultas y novedades del edificio.",
  },
];

const STEPS = [
  {
    title: "Conversamos",
    text: "Nos contás cómo es el edificio y qué necesitás mejorar.",
  },
  {
    title: "Te presentamos una propuesta",
    text: "Alcance del servicio y honorarios a medida, para llevar a la asamblea.",
  },
  {
    title: "Asamblea y traspaso",
    text: "Te acompañamos en la decisión y nos ocupamos de recibir documentación y cuentas.",
  },
  {
    title: "Gestión mes a mes",
    text: "Expensas, pagos y mantenimiento con información clara para todos los propietarios.",
  },
];

const FAQ = [
  {
    question: "¿Cómo es el cambio de administración?",
    answer:
      "El cambio se decide en asamblea de propietarios. Nosotros presentamos la propuesta, te acompañamos en la asamblea y, una vez designados, coordinamos el traspaso de documentación y cuentas con la administración anterior.",
  },
  {
    question: "¿Cuáles son los honorarios?",
    answer:
      "Se cotizan según el edificio: cantidad de unidades, servicios, personal y necesidades particulares. Contanos cómo es el tuyo y te enviamos una propuesta.",
  },
  {
    question: "¿Qué documentación necesitan para empezar?",
    answer:
      "Idealmente el reglamento de copropiedad, los libros del consorcio, las últimas liquidaciones y el estado de cuentas, los contratos con proveedores y las pólizas vigentes. Si no tenés todo a mano, empezamos con lo que haya y te orientamos.",
  },
  {
    question: "¿Cuánto tarda el traspaso?",
    answer:
      "Depende del edificio y de la colaboración de la administración anterior. Al presentar la propuesta te explicamos los pasos y los tiempos estimados para tu caso.",
  },
];

/** `/administracion-de-consorcios` — the consortium administration service and proposal form. */
export default function ConsortiumPage() {
  return (
    <main className={styles.main}>
      <div className={styles.band}>
        <section className={`${styles.inner} ${styles.hero}`}>
          <div className={styles.intro}>
            <span className={styles.eyebrow}>CONSORCIOS</span>
            <h1 className={styles.title}>Administración de consorcios en CABA</h1>
            <p className={styles.lead}>
              Liquidamos las expensas, cuidamos el mantenimiento y te acompañamos en cada asamblea.
            </p>
            <div className={styles.actions}>
              <a href="#propuesta" className={styles.primary}>
                Pedí una propuesta
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
            <p className={styles.stat}>
              <span className={styles.statNumber}>+11</span>
              <span className={styles.statLabel}>años administrando edificios en CABA</span>
            </p>
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
        <section aria-labelledby="consortium-includes" className={`${styles.inner} ${styles.block}`}>
          <h2 id="consortium-includes" className={styles.heading}>
            Qué incluye
          </h2>
          <ul className={styles.includes}>
            {INCLUDES.map(({ icon: Icon, title, text }) => (
              <li key={title} className={styles.include}>
                <span className={styles.includeIcon} aria-hidden="true">
                  <Icon size={18} />
                </span>
                <span className={styles.includeBody}>
                  <span className={styles.includeTitle}>{title}</span>
                  <span className={styles.includeText}>{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className={`${styles.band} ${styles.bandAlt}`}>
        <section aria-labelledby="consortium-process" className={`${styles.inner} ${styles.block}`}>
          <h2 id="consortium-process" className={styles.heading}>
            Cómo trabajamos
          </h2>
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
        </section>
      </div>

      <div className={styles.band}>
        <section aria-labelledby="consortium-faq" className={`${styles.inner} ${styles.faq}`}>
          <span className={styles.eyebrow}>Preguntas frecuentes</span>
          <h2 id="consortium-faq" className={styles.faqTitle}>
            Lo que suelen preguntarnos
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
          id="propuesta"
          aria-labelledby="consortium-proposal"
          className={`${styles.inner} ${styles.proposalWrap}`}
        >
          <div className={styles.proposal}>
            <div className={styles.proposalText}>
              <span className={styles.eyebrowLight}>PROPUESTA</span>
              <h2 id="consortium-proposal" className={styles.proposalTitle}>
                Contanos de tu edificio y armamos tu propuesta
              </h2>
              <p className={styles.proposalLead}>
                Dejanos los datos básicos y Gabriel se comunica con vos para conocer el consorcio y
                cotizar la administración.
              </p>
            </div>
            <div className={styles.card}>
              <ConsortiumForm action={sendConsortiumAction} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import {
  ArrowRight,
  Calculator,
  Check,
  Minus,
  Plus,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { CONSORTIUM_LICENSE } from "@/lib/contact";
import { FOUNDER } from "@/lib/public/team";
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

/** What the administration covers, grouped by theme so it reads at a glance. */
const INCLUDE_GROUPS: { icon: LucideIcon; title: string; lead: string; items: string[] }[] = [
  {
    icon: Calculator,
    title: "Cuentas",
    lead: "Expensas claras y pagos al día.",
    items: ["Liquidación de expensas", "Cobranza y morosidad", "Pago a proveedores y servicios"],
  },
  {
    icon: Wrench,
    title: "Edificio",
    lead: "El edificio en condiciones, sin sorpresas.",
    items: ["Mantenimiento y reparaciones", "Seguros y matafuegos"],
  },
  {
    icon: Users,
    title: "Gestión",
    lead: "Asambleas, normas y atención a cada propietario.",
    items: ["Asambleas y actas", "Cumplimiento legal (Ley 941)", "Atención a propietarios"],
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
          <ul className={styles.groups}>
            {INCLUDE_GROUPS.map(({ icon: Icon, title, lead, items }) => (
              <li key={title} className={styles.group}>
                <span className={styles.includeIcon} aria-hidden="true">
                  <Icon size={18} />
                </span>
                <h3 className={styles.groupTitle}>{title}</h3>
                <p className={styles.groupLead}>{lead}</p>
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
        <section aria-label="Quién te administra" className={styles.inner}>
          <div className={styles.who}>
            <span className={styles.whoPhoto}>
              <Image
                src={FOUNDER.photo}
                alt={FOUNDER.name}
                width={200}
                height={200}
                sizes="(min-width: 960px) 160px, 112px"
                className={styles.whoImage}
              />
            </span>
            <div className={styles.whoBody}>
              <span className={styles.eyebrow}>Quién te administra</span>
              <h2 className={styles.whoName}>
                {FOUNDER.name}
              </h2>
              <p className={styles.whoRpa}>Administrador de consorcios · {CONSORTIUM_LICENSE}</p>
              <p className={styles.whoRole}>
                {FOUNDER.role} · <span className={styles.whoLicense}>{FOUNDER.license}</span>
              </p>
              <p className={styles.whoText}>
                Te atiende personalmente, desde la propuesta hasta la gestión de cada mes.
              </p>
              <a
                href={buildWhatsAppLink(WHATSAPP_PHONE, WHATSAPP_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whoLink}
              >
                <WhatsAppIcon size={18} />
                Escribile a Gabriel
              </a>
            </div>
          </div>
        </section>
      </div>

      <div className={styles.band}>
        <section aria-label="Cómo trabajamos" className={`${styles.inner} ${styles.block}`}>
          <div className={`${styles.navy} ${styles.block}`}>
            <div>
              <span className={styles.eyebrow}>Cómo trabajamos</span>
              <h2 className={`${styles.heading} ${styles.processTitle}`}>
                Un cambio de administración simple y acompañado
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
          <div className={`${styles.navy} ${styles.proposal}`}>
            <div className={styles.proposalText}>
              <span className={styles.eyebrow}>PROPUESTA</span>
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

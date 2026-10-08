import Link from "next/link";
import { ArrowRight } from "lucide-react";
import styles from "./OwnerProcess.module.css";

// Provisional copy: edit here.
const EYEBROW = "CÓMO VENDEMOS TU PROPIEDAD";
const TITLE = "Un proceso claro, de la tasación a la escritura";
const STEPS = [
  {
    title: "Tasación profesional",
    text: "Visitamos tu propiedad y la comparamos con operaciones reales de la zona.",
  },
  {
    title: "Plan de venta",
    text: "Definimos juntos el precio de publicación y cómo vamos a mostrarla.",
  },
  {
    title: "Fotos y difusión",
    text: "La presentamos como se merece en los portales y en nuestros canales.",
  },
  {
    title: "Visitas y negociación",
    text: "Coordinamos las visitas, filtramos interesados y negociamos por vos.",
  },
  {
    title: "Firma y escritura",
    text: "Te acompañamos con la documentación hasta el día de la escritura.",
  },
] as const;
const CTA_LABEL = "Pedí tu tasación";

const TITLE_ID = "owner-process-title";

/**
 * Home section for owners who want to sell: five steps from the appraisal to
 * the deed and an appraisal call to action. Server component.
 *
 * DOM order (copy, steps, CTA) is the mobile reading order; from 960px a grid
 * puts the CTA to the right of the copy and the steps in a single row below.
 */
export default function OwnerProcess() {
  return (
    <section className={styles.section} aria-labelledby={TITLE_ID}>
      <div className={styles.inner}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>{EYEBROW}</p>
          <h2 id={TITLE_ID} className={styles.title}>
            {TITLE}
          </h2>
        </div>

        {/* The <ol> conveys the order; the visible numbers are decorative. */}
        <ol className={styles.steps} aria-labelledby={TITLE_ID}>
          {STEPS.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.marker} aria-hidden="true">
                {index + 1}
              </span>
              <div className={styles.stepBody}>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepText}>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <Link href="/vender" className={styles.cta}>
          {CTA_LABEL}
          <ArrowRight size={18} aria-hidden />
        </Link>
      </div>
    </section>
  );
}

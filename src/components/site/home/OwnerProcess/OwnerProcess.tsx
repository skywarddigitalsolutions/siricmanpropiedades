import Link from "next/link";
import { ArrowRight } from "lucide-react";
import styles from "./OwnerProcess.module.css";

// Provisional copy: edit here.
const EYEBROW = "PARA PROPIETARIOS";
const TITLE = "Vendé o alquilá sin complicarte";
const STEPS = [
  {
    title: "Sabé cuánto vale tu propiedad",
    text: "Visitamos y comparamos con operaciones reales de la zona.",
  },
  {
    title: "Mostrala como se merece",
    text: "Fotos, valor sugerido y un plan de difusión pensado para tu propiedad.",
  },
  {
    title: "Nosotros nos ocupamos de todo",
    text: "Visitas, negociación y acompañamiento hasta la firma.",
  },
] as const;
const CTA_LABEL = "Pedí tu tasación";

const TITLE_ID = "owner-process-title";

/**
 * Home section for property owners: three benefit-led steps from appraisal to
 * signing and an appraisal call to action. Server component.
 *
 * DOM order (copy, steps, CTA) is the mobile reading order; from 960px a grid
 * puts the CTA to the right of the copy and the steps in a row below.
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

        <Link href="/tasaciones" className={styles.cta}>
          {CTA_LABEL}
          <ArrowRight size={18} aria-hidden />
        </Link>
      </div>
    </section>
  );
}

import { Minus, Plus } from "lucide-react";
import styles from "./SellerFaq.module.css";

// Provisional copy: edit here.
const EYEBROW = "PREGUNTAS FRECUENTES";
const TITLE = "Lo que preguntan los propietarios antes de vender";
const FAQ = [
  {
    question: "¿Cuánto vale mi propiedad?",
    answer:
      "Lo definimos con una tasación: visitamos la propiedad y la comparamos con operaciones reales de la zona. Te entregamos un valor sugerido con fundamentos.",
  },
  {
    question: "¿Pedir una tasación me obliga a vender con ustedes?",
    answer: "No. Te damos el informe y vos decidís si avanzás con nosotros.",
  },
  {
    question: "¿Qué documentación necesito para vender?",
    answer:
      "Escritura, datos de los titulares, últimos impuestos y expensas pagos. Te ayudamos a reunir lo que falte.",
  },
  {
    question: "¿Cómo se muestra mi propiedad?",
    answer:
      "Con fotos cuidadas, una descripción clara y publicación en portales y en nuestros canales. Las visitas las coordinamos nosotros.",
  },
] as const;

const TITLE_ID = "seller-faq-title";

/**
 * Home FAQ for owners: native `<details>` disclosures (keyboard and screen
 * reader friendly without JavaScript). Server component.
 */
export default function SellerFaq() {
  return (
    <section className={styles.section} aria-labelledby={TITLE_ID}>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>{EYEBROW}</p>
        <h2 id={TITLE_ID} className={styles.title}>
          {TITLE}
        </h2>

        <div className={styles.list}>
          {FAQ.map(({ question, answer }) => (
            <details key={question} className={styles.item}>
              <summary className={styles.question}>
                {question}
                <span className={styles.icon} aria-hidden="true">
                  <Plus size={18} className={styles.plus} />
                  <Minus size={18} className={styles.minus} />
                </span>
              </summary>
              <p className={styles.answer}>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

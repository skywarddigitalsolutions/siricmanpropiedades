import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import styles from "./ManagementSection.module.css";

// Provisional copy: edit here.
const EYEBROW = "ADMINISTRACIÓN DE ALQUILERES";
const TITLE = "¿Tenés una propiedad alquilada? Nosotros la administramos";
const LEAD =
  "Cobramos el alquiler, te rendimos cuentas todos los meses y nos ocupamos del inquilino.";
const BENEFITS = [
  "Cobranza mensual y rendición de cuentas",
  "Ajustes de contrato y renovaciones",
  "Mantenimiento y relación con el inquilino",
] as const;
const LINK_LABEL = "Conocé el servicio";
const LINK_HREF = "/administracion-de-alquileres";

const TITLE_ID = "management-title";

/**
 * Home section for owners who already rent their property: the rental
 * management service on a navy card, its benefits and a link to its page.
 * Server component.
 *
 * DOM order (intro, benefits, link) is the mobile reading order; from 960px
 * the intro and the link sit on the left and the benefits on the right.
 */
export default function ManagementSection() {
  return (
    <section className={styles.section} aria-labelledby={TITLE_ID}>
      <div className={styles.card}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>{EYEBROW}</p>
          <h2 id={TITLE_ID} className={styles.title}>
            {TITLE}
          </h2>
          <p className={styles.lead}>{LEAD}</p>
        </div>

        <ul className={styles.benefits}>
          {BENEFITS.map((benefit) => (
            <li key={benefit} className={styles.benefit}>
              <span className={styles.benefitIcon}>
                <Check aria-hidden size={18} />
              </span>
              {benefit}
            </li>
          ))}
        </ul>

        <Link href={LINK_HREF} className={styles.link}>
          {LINK_LABEL}
          <ArrowRight aria-hidden size={18} />
        </Link>
      </div>
    </section>
  );
}

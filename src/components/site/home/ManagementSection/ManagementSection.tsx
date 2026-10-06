import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { WHATSAPP_PHONE, buildWhatsAppLink } from "@/lib/whatsapp";
import WhatsAppIcon from "../../WhatsAppIcon/WhatsAppIcon";
import styles from "./ManagementSection.module.css";

// Provisional copy: edit here.
const EYEBROW = "ADMINISTRACIÓN";
const TITLE = "Nos ocupamos de tu propiedad, todos los meses";
const LEAD =
  "Un equipo con más de 11 años administrando edificios en CABA, ahora también a cargo de tu alquiler.";
const BLOCKS = [
  {
    id: "management-rentals",
    title: "Administración de alquileres",
    text: "Dejá tu alquiler en nuestras manos y olvidate de la gestión.",
    benefits: [
      "Cobranza mensual y rendición de cuentas",
      "Ajustes de contrato y renovaciones",
      "Mantenimiento y relación con el inquilino",
    ],
  },
  {
    id: "management-consortiums",
    title: "Administración de consorcios",
    text: "Más de 11 años administrando edificios en CABA.",
    benefits: [
      "Liquidación de expensas y cobranza",
      "Proveedores y mantenimiento",
      "Asambleas y atención a propietarios",
    ],
  },
] as const;
const WHATSAPP_LABEL = "Consultar por WhatsApp";
const WHATSAPP_MESSAGE = "Hola! Quiero consultar por la administración de mi propiedad.";
const CONSORTIUM_LINK_LABEL = "Conocé administración de consorcios";
const CONSORTIUM_HREF = "/administracion-de-consorcios";

const TITLE_ID = "management-title";

/**
 * Home closing section: the two property-management services (rentals and
 * consortiums) side by side on a navy card, each with its benefits, and one
 * shared actions row (WhatsApp, consortium page). Server component.
 *
 * DOM order (intro, rentals, consortiums, actions) is the mobile reading
 * order; from 900px the two services sit in two columns below the intro.
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

        <div className={styles.blocks}>
          {BLOCKS.map((block) => (
            <article key={block.id} className={styles.block} aria-labelledby={block.id}>
              <h3 id={block.id} className={styles.blockTitle}>
                {block.title}
              </h3>
              <p className={styles.blockText}>{block.text}</p>

              <ul className={styles.benefits}>
                {block.benefits.map((benefit) => (
                  <li key={benefit} className={styles.benefit}>
                    <span className={styles.benefitIcon}>
                      <Check aria-hidden size={18} />
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className={styles.actions}>
          <a
            href={buildWhatsAppLink(WHATSAPP_PHONE, WHATSAPP_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.primary}
          >
            <WhatsAppIcon size={18} />
            {WHATSAPP_LABEL}
          </a>
          <Link href={CONSORTIUM_HREF} className={styles.secondary}>
            {CONSORTIUM_LINK_LABEL}
            <ArrowRight aria-hidden size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}

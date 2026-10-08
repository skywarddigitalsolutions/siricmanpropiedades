import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BellRing, Scale, UserRound, type LucideIcon } from "lucide-react";
import { FOUNDER } from "@/lib/public/team";
import styles from "./WhySell.module.css";

// Provisional copy: edit here.
const EYEBROW = "POR QUÉ VENDER CON NOSOTROS";
const TITLE = "Tu venta, en manos de una persona, no de un call center";
const REASONS: readonly { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: UserRound,
    title: "Hablás siempre con Gabriel",
    text: "Desde la primera visita hasta la firma, sin pasar de mano en mano.",
  },
  {
    icon: Scale,
    title: "Precio con fundamento",
    text: "Un valor sugerido basado en operaciones reales, no en promesas.",
  },
  {
    icon: BadgeCheck,
    title: "Seguridad en cada paso",
    text: "Revisamos la documentación y te explicamos cada etapa de la operación.",
  },
  {
    icon: BellRing,
    title: "Te mantenemos al tanto",
    text: "Sabés qué pasa con tu propiedad: consultas, visitas y ofertas.",
  },
];
const LINK_LABEL = "Conocé más sobre nosotros";

const TITLE_ID = "why-sell-title";

/**
 * Home section that answers "why sell with you": four reasons plus a compact
 * unboxed signature of the broker who handles every sale (photo, role and
 * license from the shared team data). Server component.
 *
 * DOM order (intro, reasons, signature) is the reading order at every width.
 */
export default function WhySell() {
  return (
    <section className={styles.section} aria-labelledby={TITLE_ID}>
      <div className={styles.inner}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>{EYEBROW}</p>
          <h2 id={TITLE_ID} className={styles.title}>
            {TITLE}
          </h2>
        </div>

        <ul className={styles.reasons} aria-labelledby={TITLE_ID}>
          {REASONS.map(({ icon: Icon, title, text }) => (
            <li key={title} className={styles.reason}>
              <span className={styles.reasonIcon}>
                <Icon size={20} aria-hidden />
              </span>
              <h3 className={styles.reasonTitle}>{title}</h3>
              <p className={styles.reasonText}>{text}</p>
            </li>
          ))}
        </ul>

        <div className={styles.person}>
          <Image
            src={FOUNDER.photo}
            alt={FOUNDER.name}
            width={200}
            height={200}
            sizes="(min-width: 960px) 72px, 64px"
            className={styles.photo}
          />
          <p className={styles.signature}>
            <span className={styles.name}>{FOUNDER.name}</span>
            <span className={styles.role}>{FOUNDER.role}</span>
            <span className={styles.license}>{FOUNDER.license}</span>
          </p>
          <Link href="/nosotros" className={styles.link}>
            {LINK_LABEL}
            <ArrowRight size={18} aria-hidden className={styles.arrow} />
          </Link>
        </div>
      </div>
    </section>
  );
}

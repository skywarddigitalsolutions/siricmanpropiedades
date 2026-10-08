import { BadgeCheck, FileSignature, Handshake, MapPin, type LucideIcon } from "lucide-react";
import { BROKER_LICENSE } from "@/lib/contact";
import styles from "./TrustStrip.module.css";

// Provisional copy: edit here.
const LABEL = "Por qué confiar en nosotros";
const ITEMS: readonly { icon: LucideIcon; title: string; detail: string }[] = [
  { icon: BadgeCheck, title: "Corredor matriculado", detail: BROKER_LICENSE },
  { icon: Handshake, title: "Trato directo", detail: "Sin intermediarios" },
  { icon: FileSignature, title: "Hasta la escritura", detail: "Con vos en cada paso" },
  { icon: MapPin, title: "Oficina en Boedo", detail: "CABA · con cita previa" },
];

/**
 * Compact strip of trust signals right under the home hero: a 2-column grid on
 * phones and a single row from 960px. Every item is a short title over a short
 * detail, so all four keep the same two-line shape. Server component.
 */
export default function TrustStrip() {
  return (
    <div className={styles.strip}>
      <ul className={styles.list} aria-label={LABEL}>
        {ITEMS.map(({ icon: Icon, title, detail }) => (
          <li key={title} className={styles.item}>
            <span className={styles.icon}>
              <Icon size={18} aria-hidden />
            </span>
            <span className={styles.text}>
              <strong className={styles.title}>{title}</strong>
              <span className={styles.detail}>{detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

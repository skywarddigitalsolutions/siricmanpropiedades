import { BadgeCheck, FileSignature, Handshake, MapPin, type LucideIcon } from "lucide-react";
import { BROKER_LICENSE } from "@/lib/contact";
import styles from "./TrustStrip.module.css";

// Provisional copy: edit here.
const LABEL = "Por qué confiar en nosotros";
const ITEMS: readonly { icon: LucideIcon; text: string }[] = [
  { icon: BadgeCheck, text: `Corredor matriculado · ${BROKER_LICENSE}` },
  { icon: Handshake, text: "Trato directo, sin intermediarios" },
  { icon: FileSignature, text: "Acompañamiento hasta la escritura" },
  { icon: MapPin, text: "Oficina en Boedo, CABA" },
];

/**
 * Compact strip of trust signals right under the home hero: a 2-column grid on
 * phones and a single row from 960px. Server component.
 */
export default function TrustStrip() {
  return (
    <div className={styles.strip}>
      <ul className={styles.list} aria-label={LABEL}>
        {ITEMS.map(({ icon: Icon, text }) => (
          <li key={text} className={styles.item}>
            <span className={styles.icon}>
              <Icon size={18} aria-hidden />
            </span>
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}

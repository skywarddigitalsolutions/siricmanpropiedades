import Link from "next/link";
import { ArrowRight } from "lucide-react";
import styles from "./ConsortiumBand.module.css";

// Provisional copy: edit here.
const EYEBROW = "CONSORCIOS";
const TITLE = "Administración de consorcios";
const TEXT =
  "Administración a cargo de Ana María Fierro Pedrayes, con 15 años de trayectoria. Liquidación de expensas, mantenimiento y asambleas, con trato directo.";
const LINK_LABEL = "Conocé la administración de consorcios";

const TITLE_ID = "consortium-band-title";

/**
 * Compact home band for the consortium administration service, the only home
 * section that names Ana María Fierro Pedrayes. Server component.
 */
export default function ConsortiumBand() {
  return (
    <section className={styles.section} aria-labelledby={TITLE_ID}>
      <div className={styles.band}>
        <div className={styles.body}>
          <p className={styles.eyebrow}>{EYEBROW}</p>
          <h2 id={TITLE_ID} className={styles.title}>
            {TITLE}
          </h2>
          <p className={styles.text}>{TEXT}</p>
        </div>
        <Link href="/administracion-de-consorcios" className={styles.link}>
          {LINK_LABEL}
          <ArrowRight size={18} aria-hidden className={styles.arrow} />
        </Link>
      </div>
    </section>
  );
}

import Link from "next/link";
import { WHATSAPP_PHONE, WHATSAPP_SELLER_MESSAGE, buildWhatsAppLink } from "@/lib/whatsapp";
import WhatsAppIcon from "../../WhatsAppIcon/WhatsAppIcon";
import styles from "./SellerCta.module.css";

// Provisional copy: edit here.
const TITLE = "¿Pensás vender tu propiedad?";
const TEXT = "Pedí tu tasación y conversemos sin compromiso.";
const PRIMARY_LABEL = "Pedí tu tasación";
const WHATSAPP_LABEL = "Escribinos por WhatsApp";

const TITLE_ID = "seller-cta-title";

/** Closing navy band of the home: the appraisal page or WhatsApp. Server component. */
export default function SellerCta() {
  return (
    <section className={styles.section} aria-labelledby={TITLE_ID}>
      <div className={styles.band}>
        <div className={styles.text}>
          <h2 id={TITLE_ID} className={styles.title}>
            {TITLE}
          </h2>
          <p className={styles.body}>{TEXT}</p>
        </div>
        <div className={styles.actions}>
          <Link href="/vender" className={styles.primary}>
            {PRIMARY_LABEL}
          </Link>
          <a
            href={buildWhatsAppLink(WHATSAPP_PHONE, WHATSAPP_SELLER_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondary}
          >
            <WhatsAppIcon size={18} />
            {WHATSAPP_LABEL}
          </a>
        </div>
      </div>
    </section>
  );
}

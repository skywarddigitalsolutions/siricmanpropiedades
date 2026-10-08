import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WHATSAPP_PHONE, WHATSAPP_SELLER_MESSAGE, buildWhatsAppLink } from "@/lib/whatsapp";
import WhatsAppIcon from "../../WhatsAppIcon/WhatsAppIcon";
import styles from "./OwnerHero.module.css";

// Provisional copy: edit here.
const EYEBROW = "PROPIETARIOS · CABA";
const TITLE = "Vendé tu propiedad con alguien que la cuide como propia.";
const SUBTITLE =
  "Tasación profesional, un plan de venta a medida y acompañamiento hasta la escritura. Te atiende Gabriel Siricman, corredor inmobiliario matriculado.";
// Phones get this shorter line; the full one shows from 640px (CSS only).
const SHORT_SUBTITLE = "Tasación, plan de venta y acompañamiento hasta la escritura.";
const PRIMARY_LABEL = "Quiero vender mi propiedad";
const WHATSAPP_LABEL = "escribinos por WhatsApp";

const TITLE_ID = "owner-hero-title";

/**
 * Home hero aimed at owners who want to sell: aerial photo of CABA under a
 * navy overlay with the copy straight on it. The primary call leads to the
 * selling page and the secondary one opens WhatsApp with the seller template.
 */
export default function OwnerHero() {
  return (
    <section className={styles.hero} aria-labelledby={TITLE_ID}>
      <Image src="/hero.jpg" alt="" fill priority sizes="100vw" className={styles.photo} />
      <div className={styles.overlay} aria-hidden />

      <div className={styles.content}>
        <p className={styles.eyebrow}>{EYEBROW}</p>
        <h1 id={TITLE_ID} className={styles.title}>
          {TITLE}
        </h1>
        <p className={styles.subtitle}>
          <span className={styles.subtitleShort}>{SHORT_SUBTITLE}</span>
          <span className={styles.subtitleFull}>{SUBTITLE}</span>
        </p>

        <div className={styles.actions}>
          <Link href="/vender" className={styles.primary}>
            {PRIMARY_LABEL}
            <ArrowRight size={18} aria-hidden />
          </Link>
          <a
            href={buildWhatsAppLink(WHATSAPP_PHONE, WHATSAPP_SELLER_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondary}
          >
            <WhatsAppIcon size={18} />
            <span>
              <span className={styles.waPrefix}>o </span>
              <span className={styles.waText}>{WHATSAPP_LABEL}</span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

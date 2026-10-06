import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import styles from "./OwnerHero.module.css";

// Provisional copy: edit here.
const EYEBROW = "PROPIETARIOS · CABA";
const TITLE = "Tu propiedad, en manos profesionales.";
const SUBTITLE = "Asesoramiento integral para vender o alquilar, con un corredor matriculado.";
// The site does not state the appraisal is free, so no "sin cargo" claim.
const PRIMARY_LABEL = "Pedí tu tasación";
const BUYER_LABEL = "Ver propiedades";
const PILL_TEXT = "Oficina en Boedo · CABA";

const TITLE_ID = "owner-hero-title";

/**
 * Home hero aimed at property owners: leads to an appraisal request, with a
 * secondary path for buyers to the listings. WhatsApp is left to the
 * site-wide floating button.
 */
// Provisional photo: https://unsplash.com/photos/ZcUTLou4jVQ by Alex Tyson,
// Unsplash License (free, not Unsplash+), downloaded 2026-10-05. Replace with
// the agency's own photography when available.
export default function OwnerHero() {
  return (
    <section className={styles.hero} aria-labelledby={TITLE_ID}>
      {/* Below 960px the inner wrapper is not positioned, so the photo is a
          full-bleed backdrop behind the card. From 960px the inner wrapper
          becomes a rounded panel the photo fills, with the card and the
          location pill floating over it. No overlay: the glass carries the
          contrast. */}
      <div className={styles.inner}>
        <div className={styles.photoBox}>
          <Image src="/hero-owner.jpg" alt="" fill priority sizes="100vw" className={styles.photo} />
        </div>

        <div className={styles.card}>
          <p className={styles.eyebrow}>{EYEBROW}</p>
          <h1 id={TITLE_ID} className={styles.title}>
            {TITLE}
          </h1>
          <p className={styles.subtitle}>{SUBTITLE}</p>

          <div className={styles.actions}>
            <Link href="/tasaciones" className={styles.primary}>
              {PRIMARY_LABEL}
              <ArrowRight size={18} aria-hidden />
            </Link>
            <Link href="/propiedades" className={styles.secondary}>
              {BUYER_LABEL}
            </Link>
          </div>
        </div>

        {/* Desktop-only location pill. Hidden from assistive tech: the footer
            and the contact page already give the office address. */}
        <div className={styles.pill} aria-hidden="true">
          <span className={styles.pillIcon}>
            <MapPin size={16} />
          </span>
          {PILL_TEXT}
        </div>
      </div>
    </section>
  );
}

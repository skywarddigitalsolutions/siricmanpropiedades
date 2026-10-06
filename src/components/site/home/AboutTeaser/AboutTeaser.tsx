import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FOUNDER } from "@/lib/public/team";
import styles from "./AboutTeaser.module.css";

// Provisional copy: edit here.
const EYEBROW = "QUIÉNES SOMOS";
const TITLE = "Una inmobiliaria con nombre y apellido";
const LINK_LABEL = "Conocé más sobre nosotros";

const TITLE_ID = "about-teaser-title";

/**
 * Home teaser for `/nosotros`: puts the founder (photo, bio, name and role,
 * from the shared team data) in front of a brand-new agency. Server component.
 */
export default function AboutTeaser() {
  return (
    <section className={styles.section} aria-labelledby={TITLE_ID}>
      <div className={styles.inner}>
        <Image
          src={FOUNDER.photo}
          alt={FOUNDER.name}
          width={200}
          height={200}
          sizes="200px"
          className={styles.photo}
        />

        <div className={styles.body}>
          <p className={styles.eyebrow}>{EYEBROW}</p>
          <h2 id={TITLE_ID} className={styles.title}>
            {TITLE}
          </h2>
          <p className={styles.bio}>{FOUNDER.bio}</p>

          <p className={styles.signature}>
            <span className={styles.name}>{FOUNDER.name}</span>
            <span className={styles.role}>{FOUNDER.role}</span>
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

import Image from "next/image";
import {
  CONTACT_EMAIL,
  INSTAGRAM_HANDLE,
  OFFICE_ADDRESS,
  OFFICE_CITY,
  OFFICE_HOURS,
  OFFICE_NEIGHBORHOOD,
  PHONE_DISPLAY,
} from "@/lib/contact";
import styles from "./Footer.module.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.logoBox}>
            <Image
              src="/logo-siricman.jpg"
              alt=""
              width={73}
              height={62}
              className={styles.logoImg}
            />
          </span>
          <span className={styles.wordmark}>
            <span className={styles.brandName}>SIRICMAN</span>
            <span className={styles.brandSub}>PROPIEDADES</span>
          </span>
        </div>

        <div className={styles.address}>
          <span>
            {OFFICE_ADDRESS} · {OFFICE_NEIGHBORHOOD}, {OFFICE_CITY}
          </span>
          <span>{OFFICE_HOURS} · con cita previa</span>
          <span>
            {PHONE_DISPLAY} · {INSTAGRAM_HANDLE}
          </span>
          <a href={`mailto:${CONTACT_EMAIL}`} className={styles.email}>
            {CONTACT_EMAIL}
          </a>
        </div>

        <div className={styles.professional}>
          <span>Gabriel Siricman · Martillero Público y Corredor Inmobiliario</span>
          <span className={styles.matricula}>Mat. CUCICBA N° [a completar]</span>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <span>© {year} Siricman Propiedades</span>
        <span>Términos y condiciones · Privacidad</span>
      </div>
    </footer>
  );
}

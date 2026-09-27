import Image from "next/image";
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
          <span>Las Casas 4054, 1° B · Boedo, CABA</span>
          <span>10:30 a 18:00 · con cita previa</span>
          <span>11 3896-7363 · @gabrielsiricman</span>
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

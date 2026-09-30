import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.hero}>
      <span className={styles.eyebrow}>Bienvenido</span>
      <h1 className={styles.title}>Siricman Propiedades</h1>
      <p className={styles.subtitle}>
        Venta y alquiler de propiedades en CABA, con asesoramiento personal de
        principio a fin.
      </p>
      <p className={styles.note}>
        Sitio en construcción. Muy pronto vas a poder ver nuestras
        propiedades acá.
      </p>
    </main>
  );
}

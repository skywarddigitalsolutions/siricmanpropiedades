import styles from "./loading.module.css";

const PLACEHOLDERS = [0, 1, 2, 3, 4, 5];

/** Results skeleton: same grid as the page, so nothing jumps when data arrives. */
export default function ResultsLoading() {
  return (
    <main className={styles.main} aria-busy="true">
      <p className="sr-only" role="status">
        Cargando propiedades…
      </p>
      <div className={styles.bar} aria-hidden>
        <div className={`${styles.block} ${styles.barRow}`} />
        <div className={`${styles.block} ${styles.barChips}`} />
      </div>
      <section className={styles.results} aria-hidden>
        <div className={styles.header}>
          <div className={`${styles.block} ${styles.title}`} />
          <div className={`${styles.block} ${styles.sort}`} />
        </div>
        <ul className={styles.grid}>
          {PLACEHOLDERS.map((key) => (
            <li key={key} className={styles.card}>
              <div className={`${styles.block} ${styles.media}`} />
              <div className={styles.body}>
                <div className={`${styles.block} ${styles.price}`} />
                <div className={`${styles.block} ${styles.line}`} />
                <div className={`${styles.block} ${styles.lineShort}`} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

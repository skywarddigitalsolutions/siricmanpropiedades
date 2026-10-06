import styles from "./loading.module.css";

/**
 * Property detail skeleton: photos (carousel on phones, mosaic on desktop),
 * the price and specs block, the title and, on desktop, the inquiry card.
 * Without it the results-grid skeleton of /propiedades would show here.
 */
export default function PropertyLoading() {
  return (
    <main className={styles.main} aria-busy="true">
      <p className="sr-only" role="status">
        Cargando propiedad…
      </p>
      <div className={styles.topRow} aria-hidden>
        <div className={`${styles.block} ${styles.back}`} />
      </div>
      <div className={styles.gallery} data-skeleton="gallery" aria-hidden>
        <div className={`${styles.block} ${styles.cover}`} />
        <div className={`${styles.block} ${styles.thumb}`} />
        <div className={`${styles.block} ${styles.thumb}`} />
        <div className={`${styles.block} ${styles.thumb}`} />
        <div className={`${styles.block} ${styles.thumb}`} />
      </div>
      <div className={styles.layout} aria-hidden>
        <div className={styles.content}>
          <div className={styles.heading} data-skeleton="price">
            <div className={`${styles.block} ${styles.price}`} />
            <div className={`${styles.block} ${styles.expenses}`} />
            <div className={`${styles.block} ${styles.specs}`} />
            <div className={styles.identity}>
              <div className={`${styles.block} ${styles.title}`} />
              <div className={`${styles.block} ${styles.titleShort}`} />
              <div className={`${styles.block} ${styles.location}`} />
            </div>
          </div>
          <div className={styles.section}>
            <div className={`${styles.block} ${styles.sectionTitle}`} />
            <div className={`${styles.block} ${styles.line}`} />
            <div className={`${styles.block} ${styles.line}`} />
            <div className={`${styles.block} ${styles.lineShort}`} />
          </div>
        </div>
        <div className={styles.inquiry} data-skeleton="inquiry">
          <div className={`${styles.block} ${styles.sectionTitle}`} />
          <div className={`${styles.block} ${styles.field}`} />
          <div className={`${styles.block} ${styles.field}`} />
          <div className={`${styles.block} ${styles.field}`} />
          <div className={`${styles.block} ${styles.button}`} />
        </div>
      </div>
    </main>
  );
}

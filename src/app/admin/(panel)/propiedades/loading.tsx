import styles from "./loading.module.css";

/** Mobile-first skeleton for `/admin/propiedades` while the Server Component fetches. */
export default function AdminPropertiesLoading() {
  return (
    <div className={styles.page} aria-hidden="true">
      <div className={styles.header} />
      <div className={styles.filters} />
      <ul className={styles.cards}>
        {["a", "b", "c", "d"].map((placeholder) => (
          <li key={placeholder} className={styles.card} />
        ))}
      </ul>
    </div>
  );
}

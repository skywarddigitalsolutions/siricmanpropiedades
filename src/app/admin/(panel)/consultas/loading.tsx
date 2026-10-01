import styles from "./loading.module.css";

/** Mobile-first skeleton for `/admin/consultas` while the Server Component fetches. */
export default function AdminLeadsLoading() {
  return (
    <div className={styles.page} aria-hidden="true">
      <div className={styles.header} />
      <div className={styles.search} />
      <div className={styles.tabs} />
      <ul className={styles.rows}>
        {["a", "b", "c", "d", "e"].map((placeholder) => (
          <li key={placeholder} className={styles.row} />
        ))}
      </ul>
    </div>
  );
}

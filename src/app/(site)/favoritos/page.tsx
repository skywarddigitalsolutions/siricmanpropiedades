import type { Metadata } from "next";
import FavoritesList from "@/components/site/favorites/FavoritesList/FavoritesList";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Mis favoritos",
  description: "Las propiedades que guardaste en este dispositivo.",
  robots: { index: false, follow: true },
};

/** `/favoritos` — saved properties, kept in the visitor's browser (no account). */
export default function FavoritesPage() {
  return (
    <main className={styles.main}>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <h1 className={styles.title}>Mis favoritos</h1>
          <p className={styles.lede}>
            Las propiedades que guardás quedan en este dispositivo; no hace falta crear una cuenta.
          </p>
        </header>
        <FavoritesList />
      </div>
    </main>
  );
}

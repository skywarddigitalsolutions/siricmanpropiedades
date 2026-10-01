import Link from "next/link";
import ResultsMessage from "@/components/site/results/ResultsMessage/ResultsMessage";
import styles from "../../site-message.module.css";

/** Shown when a property slug is unknown or no longer published. */
export default function PropertyNotFound() {
  return (
    <main className={styles.page}>
      <ResultsMessage
        titleAs="h1"
        title="Esta propiedad ya no está publicada"
        actions={<Link href="/propiedades">Ver propiedades disponibles</Link>}
      >
        Puede que ya se haya vendido o alquilado. Mirá las que tenemos disponibles hoy.
      </ResultsMessage>
    </main>
  );
}

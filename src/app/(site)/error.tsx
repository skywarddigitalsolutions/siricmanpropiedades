"use client";

import Link from "next/link";
import ResultsMessage from "@/components/site/results/ResultsMessage/ResultsMessage";
import styles from "./site-message.module.css";

/** Error boundary for the public site (for example, the API is down). */
export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className={styles.page}>
      <ResultsMessage
        titleAs="h1"
        title="Algo salió mal"
        actions={
          <>
            <button type="button" onClick={reset}>
              Reintentar
            </button>
            <Link href="/">Ir al inicio</Link>
          </>
        }
      >
        No pudimos cargar esta página. Probá de nuevo en unos segundos.
      </ResultsMessage>
    </main>
  );
}

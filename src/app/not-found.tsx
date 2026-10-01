import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header/Header";
import Footer from "@/components/layout/Footer/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton/WhatsAppButton";
import ResultsMessage from "@/components/site/results/ResultsMessage/ResultsMessage";
import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false },
};

/**
 * Global 404. It lives outside the `(site)` route group, so it renders the
 * public header and footer itself instead of inheriting that layout.
 */
export default function NotFound() {
  return (
    <>
      <Header />
      <main className={styles.page}>
        <ResultsMessage
          titleAs="h1"
          title="No encontramos esta página"
          actions={
            <>
              <Link href="/propiedades">Ver propiedades</Link>
              <Link href="/">Volver al inicio</Link>
            </>
          }
        >
          Puede que el enlace esté roto o que la página ya no exista. Probá volver al inicio o mirá las
          propiedades disponibles.
        </ResultsMessage>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}

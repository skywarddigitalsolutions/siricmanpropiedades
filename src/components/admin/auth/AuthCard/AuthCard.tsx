import Image from "next/image";
import type { ReactNode } from "react";
import styles from "./AuthCard.module.css";

type AuthCardProps = {
  children: ReactNode;
};

/**
 * Shell shared by every `/admin/(auth)` screen (ADR-7): brand panel on the
 * left from tablet up, logo on top on phones, the form on the right.
 */
export default function AuthCard({ children }: AuthCardProps) {
  return (
    <div className={styles.wrapper}>
      <aside className={styles.brandPanel}>
        <div className={styles.brand}>
          <Image
            src="/brand/logo-emblem.png"
            alt=""
            width={256}
            height={242}
            className={styles.emblem}
            priority
          />
          <span className={styles.wordmark}>
            <span className={styles.brandName}>SIRICMAN</span>
            <span className={styles.brandSub}>PROPIEDADES</span>
          </span>
        </div>
        <div className={styles.pitch}>
          <p className={styles.pitchTitle}>Panel de administración</p>
          <p className={styles.pitchText}>
            Gestioná propiedades y consultas desde un solo lugar.
          </p>
        </div>
      </aside>
      <main className={styles.formSide}>
        <div className={styles.card}>
          <div className={styles.mobileBrand}>
            <Image
              src="/brand/logo-emblem.png"
              alt="Siricman Propiedades"
              width={256}
              height={242}
              className={styles.mobileEmblem}
            />
            <span className={styles.mobileLabel}>Panel de administración</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

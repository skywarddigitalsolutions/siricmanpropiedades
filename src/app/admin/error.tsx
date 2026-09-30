"use client";

import styles from "./error.module.css";

/**
 * Client error boundary for `/admin/**` (design.md ADR-7's route tree).
 * Catches the `ApiError(0)`/API-down/missing-`API_INTERNAL_URL` failures
 * that `dal.ts`'s `getCurrentUser` deliberately rethrows instead of
 * swallowing (Requirement: Server-Side Session Validation's rethrow case).
 */
export default function AdminError() {
  return (
    <div className={styles.wrapper}>
      <p className={styles.message}>
        El servicio no está disponible. Intente nuevamente en unos minutos.
      </p>
    </div>
  );
}

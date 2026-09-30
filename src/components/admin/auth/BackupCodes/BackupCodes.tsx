"use client";

import { useState } from "react";
import styles from "./BackupCodes.module.css";

type BackupCodesProps = {
  codes: string[];
};

/**
 * Final enrollment step (ADR-8): shows the 10 one-time backup codes exactly
 * once and requires an explicit "I saved them" acknowledgement before
 * revealing the link back to `/admin/login`. The codes live only in this
 * component's props/state — a refresh loses them, by design.
 */
export default function BackupCodes({ codes }: BackupCodesProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div className={styles.wrapper}>
      <p className={styles.intro}>
        Guarde estos códigos de respaldo en un lugar seguro. Cada uno se
        puede usar una sola vez si no tiene acceso a su aplicación de
        autenticación. No se van a mostrar de nuevo.
      </p>
      <ul className={styles.list}>
        {codes.map((code) => (
          <li key={code} className={styles.code}>
            {code}
          </li>
        ))}
      </ul>
      <label className={styles.acknowledge}>
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(event) => setAcknowledged(event.target.checked)}
        />
        Los guardé
      </label>
      {acknowledged ? (
        <a href="/admin/login" className={styles.continueLink}>
          Continuar a iniciar sesión
        </a>
      ) : (
        <span className={styles.continueLinkDisabled} aria-disabled="true">
          Continuar a iniciar sesión
        </span>
      )}
    </div>
  );
}

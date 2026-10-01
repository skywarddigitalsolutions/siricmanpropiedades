"use client";

import { useState } from "react";
import AuthHeading from "../AuthHeading/AuthHeading";
import styles from "./BackupCodes.module.css";

type BackupCodesProps = {
  codes: string[];
  /** Server Action that clears the enrollment cookie and goes to login. */
  onFinish: () => void | Promise<void>;
};

/**
 * Final enrollment step (ADR-8): shows the 10 one-time backup codes exactly
 * once and requires an explicit "I saved them" acknowledgement before the
 * continue button submits `onFinish`. The codes live only in this
 * component's props/state — a refresh loses them, by design.
 */
export default function BackupCodes({ codes, onFinish }: BackupCodesProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div className={styles.wrapper}>
      <AuthHeading title="Guardá tus códigos de respaldo" />
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
      <form action={onFinish}>
        <button
          type="submit"
          className={
            acknowledged ? styles.continueLink : styles.continueLinkDisabled
          }
          disabled={!acknowledged}
        >
          Continuar a iniciar sesión
        </button>
      </form>
    </div>
  );
}

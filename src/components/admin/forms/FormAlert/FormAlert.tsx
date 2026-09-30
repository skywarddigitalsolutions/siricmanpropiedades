import type { ReactNode } from "react";
import styles from "./FormAlert.module.css";

type FormAlertProps = {
  children: ReactNode;
};

/** Accessible error/notice text for the admin auth forms (ADR-8). */
export default function FormAlert({ children }: FormAlertProps) {
  return (
    <p role="alert" className={styles.alert}>
      {children}
    </p>
  );
}

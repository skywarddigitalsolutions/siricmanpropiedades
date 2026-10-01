import type { ReactNode } from "react";
import styles from "./FormNotice.module.css";

type FormNoticeProps = {
  children: ReactNode;
};

/** Success/confirmation message, announced politely (`role="status"`); the counterpart of `FormAlert`. */
export default function FormNotice({ children }: FormNoticeProps) {
  return (
    <p role="status" className={styles.notice}>
      {children}
    </p>
  );
}

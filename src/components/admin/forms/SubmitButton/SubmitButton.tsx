"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import styles from "./SubmitButton.module.css";

type SubmitButtonProps = {
  children: ReactNode;
  pendingLabel: string;
};

/** Submit button that reflects the enclosing form's pending state (ADR-8). */
export default function SubmitButton({
  children,
  pendingLabel,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={styles.button}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import styles from "./AutoHideNotice.module.css";

type AutoHideNoticeProps = {
  children: ReactNode;
  /** How long the message stays; the user can also close it. */
  durationMs?: number;
};

/** Toast-like confirmation (`role="status"`) that hides itself after a few seconds. */
export default function AutoHideNotice({
  children,
  durationMs = 6000,
}: AutoHideNoticeProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), durationMs);
    return () => clearTimeout(timer);
  }, [durationMs]);

  if (!visible) return null;

  return (
    <div className={styles.notice}>
      <p role="status" className={styles.text}>
        {children}
      </p>
      <button
        type="button"
        className={styles.close}
        aria-label="Cerrar aviso"
        onClick={() => setVisible(false)}
      >
        <X aria-hidden size={16} />
      </button>
    </div>
  );
}

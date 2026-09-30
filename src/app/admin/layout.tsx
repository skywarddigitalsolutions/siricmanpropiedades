import type { Metadata } from "next";
import type { ReactNode } from "react";
import styles from "./layout.module.css";

// Requirement: the admin panel must never be indexed by search engines
// (ADR-7).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className={styles.shell}>{children}</div>;
}

import type { ReactNode } from "react";
import AdminHeader from "@/components/admin/panel/AdminHeader/AdminHeader";
import LogoutButton from "@/components/admin/panel/LogoutButton/LogoutButton";
import { getCurrentUser } from "@/lib/session/dal";
import { logoutAction } from "./actions";
import styles from "./layout.module.css";

/**
 * `(panel)` route-group layout (design.md ADR-7's route tree). Calls
 * `getCurrentUser()` — the same call the page below makes, deduped per
 * request via `React.cache` (ADR-7's rationale) — and renders `AdminHeader`
 * with the logout control in its trailing slot.
 */
export default async function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className={styles.panel}>
      <AdminHeader userName={user.userName}>
        <LogoutButton action={logoutAction} />
      </AdminHeader>
      <main className={styles.main}>{children}</main>
    </div>
  );
}

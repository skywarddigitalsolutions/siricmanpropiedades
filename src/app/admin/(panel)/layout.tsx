import type { ReactNode } from "react";
import AdminShell from "@/components/admin/panel/AdminShell/AdminShell";
import LogoutButton from "@/components/admin/panel/LogoutButton/LogoutButton";
import { loadNavBadges } from "@/lib/leads/nav-badges";
import { getCurrentUser, getSessionToken } from "@/lib/session/dal";
import { logoutAction } from "./actions";

/**
 * `(panel)` route-group layout (design.md ADR-7's route tree). Calls
 * `getCurrentUser()` — the same call child pages make, deduped per request
 * via `React.cache` (ADR-7's rationale) — and renders the mobile-first
 * `AdminShell` (sticky top bar + drawer on phones, persistent sidebar from
 * 960px; feature 6 T2) with the logout control passed through.
 */
export default async function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();
  // Best effort: a failing count never blocks the panel.
  const navBadges = await loadNavBadges(await getSessionToken());

  return (
    <AdminShell
      userName={user.userName}
      navBadges={navBadges}
      logout={<LogoutButton action={logoutAction} />}
    >
      {children}
    </AdminShell>
  );
}

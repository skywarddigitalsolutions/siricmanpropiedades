// Pure role gate (ADR-6). No `server-only` import: `completeSession` and
// `getCurrentUser` both call this, and it is trivially unit-testable on its
// own.

export const PANEL_ROLES = ["admin", "manager"] as const;

/** Only `admin` or `manager` may access `/admin` (Requirement: Role Gate for Admin Panel Access). */
export function canAccessPanel(roles: readonly string[]): boolean {
  return roles.some((role) => (PANEL_ROLES as readonly string[]).includes(role));
}

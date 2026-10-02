// Pure display helpers for the signed-in user (sidebar card, account page, users list).

/** Spanish labels for the back's roles. */
export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  manager: "Gerente",
  user: "Usuario",
};

/** Most privileged first. */
const ROLE_PRIORITY = ["admin", "manager", "user"] as const;

/** Label of a single role, falling back to the raw name for unknown roles. */
export function roleName(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

/** Label of the most privileged known role in `roles`, or "" when none is known. */
export function roleLabel(roles: readonly string[]): string {
  const top = ROLE_PRIORITY.find((role) => roles.includes(role));
  return top ? ROLE_LABELS[top] : "";
}

/** Up to two uppercase initials from a user name ("maria.lopez" -> "ML"); "" when none. */
export function initialsOf(userName: string): string {
  const words = userName.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

import "server-only";
import { apiFetch } from "./client";

export type UserRole = { id: string; name: string };

/** Item of `GET /api/users` (admin only); roles come through the `userRoles` join. */
export type PanelUser = {
  id: string;
  userName: string;
  isActive: boolean;
  userRoles: { role: UserRole }[];
};

/** The back returns a plain array (newest first); 100 is its practical page here. */
export function listUsers(token: string): Promise<PanelUser[]> {
  return apiFetch<PanelUser[]>("/users?limit=100", { token });
}

/** Roles an admin may assign (`admin` itself is excluded by the back). */
export function listAvailableRoles(token: string): Promise<UserRole[]> {
  return apiFetch<UserRole[]>("/roles/available", { token });
}

export function createUser(
  token: string,
  body: { userName: string; password: string; roleId: string },
): Promise<unknown> {
  return apiFetch("/users", { method: "POST", body, token });
}

export function activateUser(token: string, id: string): Promise<unknown> {
  return apiFetch(`/users/${id}/activate`, { method: "PATCH", token });
}

export function deactivateUser(token: string, id: string): Promise<unknown> {
  return apiFetch(`/users/${id}/deactivate`, { method: "PATCH", token });
}

/** Also ends every session of that user on the back. */
export function resetUserPassword(
  token: string,
  id: string,
  newPassword: string,
): Promise<unknown> {
  return apiFetch(`/users/${id}/reset-password`, {
    method: "PATCH",
    body: { newPassword },
    token,
  });
}

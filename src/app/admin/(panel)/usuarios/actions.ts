"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import {
  activateUser,
  createUser,
  deactivateUser,
  resetUserPassword,
} from "@/lib/api/users";
import { passwordPolicyError } from "@/lib/password-policy";
import { getCurrentUser, getSessionToken } from "@/lib/session/dal";
import { handleSessionError } from "@/lib/session/session-error";
import {
  GENERIC_USER_ERROR,
  SELF_DEACTIVATE_MESSAGE,
  type UserFormState,
} from "@/lib/users/user-forms";

/** Every action re-checks the role: hiding the nav item is not authorization. */
async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user.roles.includes("admin")) redirect("/admin");
  return user;
}

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function failure(error: unknown, map?: (error: ApiError) => UserFormState | undefined): UserFormState {
  if (!(error instanceof ApiError)) throw error;
  if (error.status === 401) handleSessionError(error);
  return map?.(error) ?? { error: GENERIC_USER_ERROR };
}

function refresh() {
  revalidatePath("/admin/usuarios");
}

export async function createUserAction(
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  await requireAdmin();

  const userName = text(formData, "userName").trim().toLowerCase();
  const password = text(formData, "password");
  const roleId = text(formData, "roleId");

  const fieldErrors: NonNullable<UserFormState["fieldErrors"]> = {};
  if (!userName) fieldErrors.userName = "Ingresá el usuario.";
  const policy = passwordPolicyError(password);
  if (policy) fieldErrors.password = policy;
  if (!roleId) fieldErrors.roleId = "Elegí un rol.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const token = await getSessionToken();
  try {
    await createUser(token, { userName, password, roleId });
  } catch (error) {
    return failure(error, (apiError) =>
      apiError.status === 400 && apiError.details.some((d) => d.includes("is already taken"))
        ? { fieldErrors: { userName: "Ese usuario ya existe." } }
        : undefined,
    );
  }

  refresh();
  return { message: "Usuario creado." };
}

/** Bound by the page: `(id, active)` first, then the `useActionState` pair. */
export async function setActiveAction(
  id: string,
  active: boolean,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevState: UserFormState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<UserFormState> {
  const me = await requireAdmin();
  if (!active && id === me.id) return { error: SELF_DEACTIVATE_MESSAGE };

  const token = await getSessionToken();
  try {
    await (active ? activateUser(token, id) : deactivateUser(token, id));
  } catch (error) {
    return failure(error);
  }

  refresh();
  return { message: active ? "Usuario activado." : "Usuario desactivado." };
}

export async function resetPasswordAction(
  id: string,
  _prevState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  await requireAdmin();

  const newPassword = text(formData, "newPassword");
  const policy = passwordPolicyError(newPassword);
  if (policy) return { fieldErrors: { password: policy } };

  const token = await getSessionToken();
  try {
    await resetUserPassword(token, id, newPassword);
  } catch (error) {
    return failure(error);
  }

  return { message: "Contraseña blanqueada. Se cerraron las sesiones de ese usuario." };
}

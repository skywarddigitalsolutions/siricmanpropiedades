// Client-safe state and copy for the users screen.

export type UserFormState = {
  message?: string;
  error?: string;
  fieldErrors?: { userName?: string; password?: string; roleId?: string };
};

export const GENERIC_USER_ERROR =
  "No pudimos completar la acción. Intentá de nuevo en unos minutos.";
export const SELF_DEACTIVATE_MESSAGE = "No podés desactivar tu propia cuenta.";

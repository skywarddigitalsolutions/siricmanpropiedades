// Password policy shared with the back (`common/constants/password.constants.ts`):
// 6-50 characters with an uppercase letter, a lowercase letter and a number
// (the back also accepts a symbol in place of the number). The back stays the
// authority; this only gives instant feedback in the forms.

export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 50;

export const PASSWORD_HINT = "De 6 a 50 caracteres, con mayúscula, minúscula y número.";

/** Spanish message for the first rule the password breaks, or `undefined` when it is valid. */
export function passwordPolicyError(password: string): string | undefined {
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    return "La contraseña debe tener entre 6 y 50 caracteres.";
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
    return "Tiene que incluir al menos una mayúscula y una minúscula.";
  }
  if (!/\d|\W/.test(password)) {
    return "Tiene que incluir al menos un número.";
  }
  return undefined;
}

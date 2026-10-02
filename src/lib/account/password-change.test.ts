import { describe, expect, it } from "vitest";
import {
  LOCKOUT_MESSAGE,
  mapBackupCodesFailure,
  mapPasswordChangeFailure,
  validateBackupCodeRequest,
  validatePasswordChange,
} from "./password-change";

const valid = {
  currentPassword: "Actual1",
  newPassword: "Nueva123",
  confirmPassword: "Nueva123",
  code: "123456",
};

describe("validatePasswordChange", () => {
  it("returns nothing for valid input", () => {
    expect(validatePasswordChange(valid)).toBeUndefined();
  });

  it("requires the current password and the new one", () => {
    const errors = validatePasswordChange({ ...valid, currentPassword: "", newPassword: "" });
    expect(errors?.currentPassword).toBe("Ingresá tu contraseña actual.");
    expect(errors?.newPassword).toBeTruthy();
  });

  it("applies the password policy to the new password", () => {
    expect(validatePasswordChange({ ...valid, newPassword: "abc", confirmPassword: "abc" })?.newPassword)
      .toMatch(/entre 6 y 50/);
  });

  it("requires the confirmation to match", () => {
    expect(validatePasswordChange({ ...valid, confirmPassword: "Otra1234" })?.confirmPassword).toBe(
      "Las contraseñas no coinciden.",
    );
  });

  it("rejects reusing the current password", () => {
    expect(
      validatePasswordChange({ ...valid, newPassword: "Actual1", confirmPassword: "Actual1" })
        ?.newPassword,
    ).toBe("La nueva contraseña tiene que ser distinta de la actual.");
  });

  it("accepts an empty code (accounts without MFA) but not a malformed one", () => {
    expect(validatePasswordChange({ ...valid, code: "" })).toBeUndefined();
    expect(validatePasswordChange({ ...valid, code: "12" })?.code).toMatch(/código/i);
    expect(validatePasswordChange({ ...valid, code: "ab cd!" })?.code).toMatch(/código/i);
    expect(validatePasswordChange({ ...valid, code: "a1b2c3d4e5" })).toBeUndefined();
  });
});

describe("mapPasswordChangeFailure", () => {
  it("maps a wrong current password", () => {
    expect(mapPasswordChangeFailure(400, ["Current password is incorrect"]).fieldErrors).toEqual({
      currentPassword: "La contraseña actual no es correcta.",
    });
  });

  it("maps an invalid or missing MFA code", () => {
    expect(mapPasswordChangeFailure(400, ["Invalid code"]).fieldErrors?.code).toMatch(/no es válido/);
    expect(mapPasswordChangeFailure(400, ["MFA code is required"]).fieldErrors?.code).toMatch(
      /Ingresá el código/,
    );
  });

  it("maps reusing the same password", () => {
    expect(
      mapPasswordChangeFailure(400, ["New password must be different from the current one"])
        .fieldErrors?.newPassword,
    ).toBe("La nueva contraseña tiene que ser distinta de la actual.");
  });

  it("maps policy validation messages to the new password field", () => {
    expect(
      mapPasswordChangeFailure(400, ["Password must have uppercase, lowercase letter and a number"])
        .fieldErrors?.newPassword,
    ).toMatch(/mayúscula/);
    expect(
      mapPasswordChangeFailure(400, ["newPassword must be longer than or equal to 6 characters"])
        .fieldErrors?.newPassword,
    ).toMatch(/entre 6 y 50/);
  });

  it("maps a lockout (429) to a friendly message", () => {
    expect(mapPasswordChangeFailure(429, ["Too many attempts"]).error).toBe(LOCKOUT_MESSAGE);
  });

  it("falls back to a generic error", () => {
    expect(mapPasswordChangeFailure(0, []).error).toMatch(/No pudimos/);
    expect(mapPasswordChangeFailure(500, []).error).toMatch(/No pudimos/);
    expect(mapPasswordChangeFailure(400, ["algo raro"]).error).toMatch(/No pudimos/);
  });
});

describe("backup codes", () => {
  it("requires exactly a 6-digit authenticator code", () => {
    expect(validateBackupCodeRequest("123456")).toBeUndefined();
    expect(validateBackupCodeRequest("")).toMatch(/6 dígitos/);
    expect(validateBackupCodeRequest("12345")).toMatch(/6 dígitos/);
    expect(validateBackupCodeRequest("abcdef")).toMatch(/6 dígitos/);
  });

  it("maps failures", () => {
    expect(mapBackupCodesFailure(400, ["Invalid code"]).codeError).toMatch(/no es válido/);
    expect(mapBackupCodesFailure(400, ["MFA is not enabled"]).error).toMatch(/verificación en dos pasos/);
    expect(mapBackupCodesFailure(429, []).error).toBe(LOCKOUT_MESSAGE);
    expect(mapBackupCodesFailure(500, []).error).toMatch(/No pudimos/);
  });
});

import { describe, expect, it } from "vitest";
import { getAuthErrorMessage, getSessionNoticeMessage } from "./messages";

describe("getAuthErrorMessage", () => {
  it.each([
    ["invalid-credentials", "Usuario o contraseña incorrectos."],
    [
      "throttled",
      "Demasiados intentos. Espere unos minutos e intente nuevamente.",
    ],
    [
      "no-access",
      "Esta cuenta no tiene acceso al panel de administración.",
    ],
    [
      "invalid-code",
      "El código no es válido. Si el problema continúa, vuelva a iniciar sesión.",
    ],
    [
      "invalid-password",
      "La contraseña no es correcta o la verificación expiró.",
    ],
    [
      "unavailable",
      "El servicio no está disponible. Intente nuevamente en unos minutos.",
    ],
    ["validation", "Complete todos los campos."],
  ] as const)("maps %s to the exact neutral-Spanish message", (code, message) => {
    expect(getAuthErrorMessage(code)).toBe(message);
  });
});

describe("getSessionNoticeMessage", () => {
  it("maps 'expired' to the session-expired notice", () => {
    expect(getSessionNoticeMessage("expired")).toBe(
      "Su sesión expiró. Inicie sesión nuevamente.",
    );
  });

  it("maps 'forbidden' to the same text as the no-access error", () => {
    expect(getSessionNoticeMessage("forbidden")).toBe(
      getAuthErrorMessage("no-access"),
    );
  });
});

// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCookieStore, expectRedirect, RedirectError } from "@/test/next-server";
import { SESSION_COOKIE } from "@/lib/session/cookie-names";

const { cookies } = vi.hoisted(() => ({ cookies: vi.fn() }));
vi.mock("next/headers", () => ({ cookies }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
}));

const { changePassword, regenerateBackupCodes } = vi.hoisted(() => ({
  changePassword: vi.fn(),
  regenerateBackupCodes: vi.fn(),
}));
vi.mock("@/lib/api/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/auth")>();
  return { ...actual, changePassword, regenerateBackupCodes };
});

import { ApiError } from "@/lib/api/client";
import { changePasswordAction, regenerateBackupCodesAction } from "./actions";

function formDataFor(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

const valid = {
  currentPassword: "Actual1",
  newPassword: "Nueva123",
  confirmPassword: "Nueva123",
  code: "123456",
};

let store: ReturnType<typeof createCookieStore>;

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  store = createCookieStore({ [SESSION_COOKIE]: "old-jwt" });
  cookies.mockResolvedValue(store);
  changePassword.mockReset();
  regenerateBackupCodes.mockReset();
});

describe("changePasswordAction", () => {
  it("validates before calling the API", async () => {
    const state = await changePasswordAction({}, formDataFor({ ...valid, confirmPassword: "Otra1234" }));

    expect(state.fieldErrors?.confirmPassword).toBe("Las contraseñas no coinciden.");
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("swaps the session cookie for the returned token and confirms", async () => {
    changePassword.mockResolvedValue({
      id: "u1",
      userName: "gabriel",
      isActive: true,
      roles: ["admin"],
      token: "new-jwt",
    });

    const state = await changePasswordAction({}, formDataFor(valid));

    expect(changePassword).toHaveBeenCalledWith("old-jwt", {
      currentPassword: "Actual1",
      newPassword: "Nueva123",
      code: "123456",
    });
    expect(store.get(SESSION_COOKIE)?.value).toBe("new-jwt");
    expect(state.message).toBe("Tu contraseña se actualizó. Se cerraron tus otras sesiones.");
  });

  it("omits the code when the account has no MFA", async () => {
    changePassword.mockResolvedValue({ id: "u1", userName: "g", isActive: true, roles: [], token: "t" });

    await changePasswordAction({}, formDataFor({ ...valid, code: "" }));

    expect(changePassword).toHaveBeenCalledWith("old-jwt", {
      currentPassword: "Actual1",
      newPassword: "Nueva123",
    });
  });

  it("maps a 400 to field errors and keeps the current cookie", async () => {
    changePassword.mockRejectedValue(new ApiError(400, "Current password is incorrect"));

    const state = await changePasswordAction({}, formDataFor(valid));

    expect(state.fieldErrors?.currentPassword).toBe("La contraseña actual no es correcta.");
    expect(store.get(SESSION_COOKIE)?.value).toBe("old-jwt");
  });

  it("maps a 429 to the lockout message", async () => {
    changePassword.mockRejectedValue(new ApiError(429, "Too many attempts"));

    const state = await changePasswordAction({}, formDataFor(valid));

    expect(state.error).toMatch(/Demasiados intentos/);
  });

  it("redirects to login on a 401 (expired session)", async () => {
    changePassword.mockRejectedValue(new ApiError(401, "Unauthorized"));

    await expectRedirect(
      changePasswordAction({}, formDataFor(valid)),
      "/admin/login?reason=expired",
    );
  });

  it("redirects to login without a session cookie", async () => {
    store = createCookieStore();
    cookies.mockResolvedValue(store);

    await expectRedirect(changePasswordAction({}, formDataFor(valid)), "/admin/login");
    expect(changePassword).not.toHaveBeenCalled();
  });
});

describe("regenerateBackupCodesAction", () => {
  it("validates the TOTP format first", async () => {
    const state = await regenerateBackupCodesAction({}, formDataFor({ code: "12" }));

    expect(state.codeError).toMatch(/6 dígitos/);
    expect(regenerateBackupCodes).not.toHaveBeenCalled();
  });

  it("returns the new codes once", async () => {
    regenerateBackupCodes.mockResolvedValue({ backupCodes: ["aaaaaaaaaa", "bbbbbbbbbb"] });

    const state = await regenerateBackupCodesAction({}, formDataFor({ code: "123456" }));

    expect(regenerateBackupCodes).toHaveBeenCalledWith("old-jwt", "123456");
    expect(state.codes).toEqual(["aaaaaaaaaa", "bbbbbbbbbb"]);
  });

  it("maps an invalid code, a lockout and a missing MFA", async () => {
    regenerateBackupCodes.mockRejectedValueOnce(new ApiError(400, "Invalid code"));
    expect((await regenerateBackupCodesAction({}, formDataFor({ code: "123456" }))).codeError).toMatch(
      /no es válido/,
    );

    regenerateBackupCodes.mockRejectedValueOnce(new ApiError(429, "Too many"));
    expect((await regenerateBackupCodesAction({}, formDataFor({ code: "123456" }))).error).toMatch(
      /Demasiados intentos/,
    );

    regenerateBackupCodes.mockRejectedValueOnce(new ApiError(400, "MFA is not enabled"));
    expect((await regenerateBackupCodesAction({}, formDataFor({ code: "123456" }))).error).toMatch(
      /verificación en dos pasos/,
    );
  });

  it("redirects to login on a 401", async () => {
    regenerateBackupCodes.mockRejectedValue(new ApiError(401, "Unauthorized"));

    await expectRedirect(
      regenerateBackupCodesAction({}, formDataFor({ code: "123456" })),
      "/admin/login?reason=expired",
    );
  });
});

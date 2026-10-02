// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { expectRedirect, RedirectError } from "@/test/next-server";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { getCurrentUser, getSessionToken } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getSessionToken: vi.fn(),
}));
vi.mock("@/lib/session/dal", () => ({ getCurrentUser, getSessionToken }));

const users = vi.hoisted(() => ({
  createUser: vi.fn(),
  activateUser: vi.fn(),
  deactivateUser: vi.fn(),
  resetUserPassword: vi.fn(),
}));
vi.mock("@/lib/api/users", () => users);

import { ApiError } from "@/lib/api/client";
import { createUserAction, resetPasswordAction, setActiveAction } from "./actions";

function fd(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [k, v] of Object.entries(fields)) formData.set(k, v);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionToken.mockResolvedValue("jwt");
  getCurrentUser.mockResolvedValue({ id: "me", userName: "root", isActive: true, roles: ["admin"] });
});

describe("admin gate", () => {
  it("redirects non-admins away from every action", async () => {
    getCurrentUser.mockResolvedValue({ id: "m", userName: "m", isActive: true, roles: ["manager"] });

    await expectRedirect(createUserAction({}, fd({})), "/admin");
    await expectRedirect(setActiveAction("u1", true, {}, fd({})), "/admin");
    await expectRedirect(resetPasswordAction("u1", {}, fd({})), "/admin");
    expect(users.createUser).not.toHaveBeenCalled();
  });
});

describe("createUserAction", () => {
  const valid = { userName: " Ana ", password: "Abcde1", roleId: "role-1" };

  it("validates the fields", async () => {
    const state = await createUserAction({}, fd({ userName: "", password: "abc", roleId: "" }));

    expect(state.fieldErrors?.userName).toBeTruthy();
    expect(state.fieldErrors?.password).toMatch(/entre 6 y 50/);
    expect(state.fieldErrors?.roleId).toBeTruthy();
    expect(users.createUser).not.toHaveBeenCalled();
  });

  it("creates the user with a normalized user name", async () => {
    users.createUser.mockResolvedValue({});

    const state = await createUserAction({}, fd(valid));

    expect(users.createUser).toHaveBeenCalledWith("jwt", {
      userName: "ana",
      password: "Abcde1",
      roleId: "role-1",
    });
    expect(state.message).toBe("Usuario creado.");
  });

  it("maps a taken user name", async () => {
    users.createUser.mockRejectedValue(new ApiError(400, 'Username "ana" is already taken'));

    const state = await createUserAction({}, fd(valid));

    expect(state.fieldErrors?.userName).toBe("Ese usuario ya existe.");
  });

  it("redirects to login on 401 and reports other failures", async () => {
    users.createUser.mockRejectedValueOnce(new ApiError(401, "x"));
    await expectRedirect(createUserAction({}, fd(valid)), "/admin/login?reason=expired");

    users.createUser.mockRejectedValueOnce(new ApiError(500, "boom"));
    expect((await createUserAction({}, fd(valid))).error).toMatch(/No pudimos/);
  });
});

describe("setActiveAction", () => {
  it("activates and deactivates", async () => {
    await setActiveAction("u1", false, {}, fd({}));
    expect(users.deactivateUser).toHaveBeenCalledWith("jwt", "u1");

    const state = await setActiveAction("u1", true, {}, fd({}));
    expect(users.activateUser).toHaveBeenCalledWith("jwt", "u1");
    expect(state.message).toBe("Usuario activado.");
  });

  it("never lets an admin deactivate themselves", async () => {
    const state = await setActiveAction("me", false, {}, fd({}));

    expect(state.error).toBe("No podés desactivar tu propia cuenta.");
    expect(users.deactivateUser).not.toHaveBeenCalled();
  });
});

describe("resetPasswordAction", () => {
  it("validates the password policy", async () => {
    const state = await resetPasswordAction("u1", {}, fd({ newPassword: "abc" }));

    expect(state.fieldErrors?.password).toMatch(/entre 6 y 50/);
    expect(users.resetUserPassword).not.toHaveBeenCalled();
  });

  it("resets and mentions the closed sessions", async () => {
    const state = await resetPasswordAction("u1", {}, fd({ newPassword: "Nueva123" }));

    expect(users.resetUserPassword).toHaveBeenCalledWith("jwt", "u1", "Nueva123");
    expect(state.message).toBe("Contraseña blanqueada. Se cerraron las sesiones de ese usuario.");
  });
});

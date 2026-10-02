// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));
vi.mock("./client", () => ({ apiFetch }));

import {
  activateUser,
  createUser,
  deactivateUser,
  listAvailableRoles,
  listUsers,
  resetUserPassword,
} from "./users";

beforeEach(() => apiFetch.mockReset());

describe("users API", () => {
  it("lists users (up to 100) and available roles", async () => {
    apiFetch.mockResolvedValue([]);
    await listUsers("jwt");
    expect(apiFetch).toHaveBeenCalledWith("/users?limit=100", { token: "jwt" });

    await listAvailableRoles("jwt");
    expect(apiFetch).toHaveBeenCalledWith("/roles/available", { token: "jwt" });
  });

  it("creates a user", async () => {
    await createUser("jwt", { userName: "ana", password: "Abcde1", roleId: "r1" });
    expect(apiFetch).toHaveBeenCalledWith("/users", {
      method: "POST",
      body: { userName: "ana", password: "Abcde1", roleId: "r1" },
      token: "jwt",
    });
  });

  it("activates, deactivates and resets the password", async () => {
    await activateUser("jwt", "u1");
    expect(apiFetch).toHaveBeenCalledWith("/users/u1/activate", { method: "PATCH", token: "jwt" });

    await deactivateUser("jwt", "u1");
    expect(apiFetch).toHaveBeenCalledWith("/users/u1/deactivate", { method: "PATCH", token: "jwt" });

    await resetUserPassword("jwt", "u1", "Nueva123");
    expect(apiFetch).toHaveBeenCalledWith("/users/u1/reset-password", {
      method: "PATCH",
      body: { newPassword: "Nueva123" },
      token: "jwt",
    });
  });
});

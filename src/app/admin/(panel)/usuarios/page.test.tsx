import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { RedirectError, expectRedirect } from "@/test/next-server";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
}));

const { getCurrentUser, getSessionToken } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getSessionToken: vi.fn(),
}));
vi.mock("@/lib/session/dal", () => ({ getCurrentUser, getSessionToken }));

const { listUsers, listAvailableRoles } = vi.hoisted(() => ({
  listUsers: vi.fn(),
  listAvailableRoles: vi.fn(),
}));
vi.mock("@/lib/api/users", () => ({ listUsers, listAvailableRoles }));

vi.mock("./actions", () => ({
  createUserAction: vi.fn(),
  setActiveAction: vi.fn(),
  resetPasswordAction: vi.fn(),
}));

import { ApiError } from "@/lib/api/client";
import UsersPage from "./page";

const USERS = [
  { id: "me", userName: "root", isActive: true, userRoles: [{ role: { id: "r0", name: "admin" } }] },
  { id: "u2", userName: "ana", isActive: true, userRoles: [{ role: { id: "r1", name: "manager" } }] },
  { id: "u3", userName: "luis", isActive: false, userRoles: [{ role: { id: "r2", name: "user" } }] },
];

beforeEach(() => {
  vi.clearAllMocks();
  getSessionToken.mockResolvedValue("jwt");
  getCurrentUser.mockResolvedValue({ id: "me", userName: "root", isActive: true, roles: ["admin"] });
  listUsers.mockResolvedValue(USERS);
  listAvailableRoles.mockResolvedValue([{ id: "r1", name: "manager" }]);
});

afterEach(cleanup);

describe("UsersPage", () => {
  it("redirects non-admins to the home", async () => {
    getCurrentUser.mockResolvedValue({ id: "m", userName: "m", isActive: true, roles: ["manager"] });

    await expectRedirect(UsersPage(), "/admin");
    expect(listUsers).not.toHaveBeenCalled();
  });

  it("lists users with role and active badges", async () => {
    render(await UsersPage());

    expect(screen.getByRole("heading", { level: 1, name: "Usuarios" })).toBeInTheDocument();
    const ana = screen.getByRole("listitem", { name: "ana" });
    expect(within(ana).getByText("Gerente")).toBeInTheDocument();
    expect(within(ana).getByText("Activo")).toHaveAttribute("data-tone", "success");
    const luis = screen.getByRole("listitem", { name: "luis" });
    expect(within(luis).getByText("Inactivo")).toHaveAttribute("data-tone", "neutral");
  });

  it("marks the current user and blocks deactivating them", async () => {
    render(await UsersPage());

    const me = screen.getByRole("listitem", { name: "root" });
    expect(within(me).getByText("Vos")).toBeInTheDocument();
    expect(within(me).getByRole("button", { name: "Desactivar" })).toBeDisabled();
  });

  it("offers the new user button", async () => {
    render(await UsersPage());

    expect(screen.getByRole("button", { name: "Nuevo usuario" })).toBeInTheDocument();
  });

  it("shows a notice instead of crashing when the API is down", async () => {
    listUsers.mockRejectedValue(new ApiError(0, "down"));

    render(await UsersPage());

    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar los usuarios");
  });
});

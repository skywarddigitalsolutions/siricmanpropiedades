import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const { getCurrentUser } = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/session/dal", () => ({ getCurrentUser }));

vi.mock("./actions", () => ({
  changePasswordAction: vi.fn(),
  regenerateBackupCodesAction: vi.fn(),
}));

import AccountPage from "./page";

beforeEach(() => {
  getCurrentUser.mockResolvedValue({
    id: "u1",
    userName: "maria.lopez",
    isActive: true,
    roles: ["manager"],
  });
});

afterEach(cleanup);

describe("AccountPage", () => {
  it("shows the profile summary with name and role", async () => {
    render(await AccountPage());

    expect(screen.getByRole("heading", { level: 1, name: "Mi cuenta" })).toBeInTheDocument();
    expect(screen.getAllByText("maria.lopez").length).toBeGreaterThan(0);
    expect(screen.getByText("Gerente")).toBeInTheDocument();
  });

  it("offers the password change and the backup codes sections", async () => {
    render(await AccountPage());

    expect(screen.getByRole("heading", { level: 2, name: "Cambiar contraseña" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Códigos de respaldo" })).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña actual")).toBeInTheDocument();
    expect(screen.getByLabelText("Código de tu app de autenticación")).toBeInTheDocument();
  });

  it("lays out profile and backup codes in one column and the password form in the other", async () => {
    const { container } = render(await AccountPage());

    const profile = container.querySelector('[data-column="profile"]')!;
    const security = container.querySelector('[data-column="security"]')!;
    expect(profile.contains(screen.getByRole("heading", { name: "Códigos de respaldo" }))).toBe(true);
    expect(profile.contains(screen.getByLabelText("Perfil"))).toBe(true);
    expect(security.contains(screen.getByRole("heading", { name: "Cambiar contraseña" }))).toBe(true);
    expect(security.contains(screen.getByLabelText("Nueva contraseña"))).toBe(true);
    expect(security.contains(screen.getByLabelText("Repetir nueva contraseña"))).toBe(true);
  });
});

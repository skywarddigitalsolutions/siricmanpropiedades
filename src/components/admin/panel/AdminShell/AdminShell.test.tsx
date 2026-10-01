import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname }));

import AdminShell from "./AdminShell";

afterEach(() => {
  cleanup();
});

describe("AdminShell", () => {
  it("renders the signed-in user's name and the logout slot", () => {
    usePathname.mockReturnValue("/admin/propiedades");
    render(
      <AdminShell userName="gabriel" logout={<button>Cerrar sesión</button>}>
        <p>Contenido</p>
      </AdminShell>,
    );

    expect(screen.getAllByText("gabriel").length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: "Cerrar sesión" }).length,
    ).toBeGreaterThan(0);
  });

  it("passes nav badges to the sidebar navigation", () => {
    usePathname.mockReturnValue("/admin/propiedades");
    render(
      <AdminShell
        userName="gabriel"
        logout={<button>Cerrar sesión</button>}
        navBadges={{ "/admin/consultas": 2 }}
      >
        <p>contenido</p>
      </AdminShell>,
    );

    expect(screen.getByRole("link", { name: "Consultas, 2 nuevas" })).toBeInTheDocument();
  });

  it("shows a user card with initials and the role label", () => {
    usePathname.mockReturnValue("/admin");
    render(
      <AdminShell
        userName="maria.lopez"
        roles={["manager"]}
        logout={<button>Cerrar sesión</button>}
      >
        <p>Contenido</p>
      </AdminShell>,
    );

    expect(screen.getAllByText("ML").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Gerente").length).toBeGreaterThan(0);
  });

  it("shows Usuarios in the nav only for admins", () => {
    usePathname.mockReturnValue("/admin");
    const { unmount } = render(
      <AdminShell userName="a" roles={["manager"]} logout={<button>Cerrar sesión</button>}>
        <p>x</p>
      </AdminShell>,
    );
    expect(screen.queryByRole("link", { name: "Usuarios" })).not.toBeInTheDocument();
    unmount();

    render(
      <AdminShell userName="a" roles={["admin"]} logout={<button>Cerrar sesión</button>}>
        <p>x</p>
      </AdminShell>,
    );
    expect(screen.getAllByRole("link", { name: "Usuarios" }).length).toBeGreaterThan(0);
  });

  it("renders the page content passed as children", () => {
    usePathname.mockReturnValue("/admin/propiedades");
    render(
      <AdminShell userName="gabriel" logout={<button>Cerrar sesión</button>}>
        <p>Contenido de la página</p>
      </AdminShell>,
    );

    expect(screen.getByText("Contenido de la página")).toBeInTheDocument();
  });

  it("opens the nav drawer with the menu button and closes it with the close button", async () => {
    usePathname.mockReturnValue("/admin/propiedades");
    const user = userEvent.setup();
    render(
      <AdminShell userName="gabriel" logout={<button>Cerrar sesión</button>}>
        <p>Contenido</p>
      </AdminShell>,
    );

    const menuButton = screen.getByRole("button", { name: /menú/i });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    const closeButton = within(dialog).getByRole("button", {
      name: "Cerrar menú",
    });
    await user.click(closeButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the nav drawer when Escape is pressed", async () => {
    usePathname.mockReturnValue("/admin/propiedades");
    const user = userEvent.setup();
    render(
      <AdminShell userName="gabriel" logout={<button>Cerrar sesión</button>}>
        <p>Contenido</p>
      </AdminShell>,
    );

    await user.click(screen.getByRole("button", { name: /menú/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the nav drawer when a nav link inside it is clicked", async () => {
    usePathname.mockReturnValue("/admin/otra");
    const user = userEvent.setup();
    render(
      <AdminShell userName="gabriel" logout={<button>Cerrar sesión</button>}>
        <p>Contenido</p>
      </AdminShell>,
    );

    await user.click(screen.getByRole("button", { name: /menú/i }));
    const dialog = screen.getByRole("dialog");

    await user.click(within(dialog).getByRole("link", { name: "Propiedades" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

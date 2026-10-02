import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Header from "./Header";

afterEach(() => {
  cleanup();
});

describe("Header", () => {
  it("shows the transparent emblem as the brand logo", () => {
    render(<Header />);

    const logo = screen.getByRole("img", { name: "Siricman Propiedades" });
    expect(logo.getAttribute("src")).toContain("logo-emblem");
  });

  it("renders the desktop navigation links with the correct hrefs", () => {
    render(<Header />);

    expect(screen.getByRole("link", { name: "Comprar" })).toHaveAttribute(
      "href",
      "/propiedades?operacion=venta",
    );
    expect(screen.getByRole("link", { name: "Alquilar" })).toHaveAttribute(
      "href",
      "/propiedades?operacion=alquiler",
    );
    expect(screen.getByRole("link", { name: "Tasaciones" })).toHaveAttribute(
      "href",
      "/tasaciones",
    );
    expect(screen.getByRole("link", { name: "Consorcios" })).toHaveAttribute(
      "href",
      "/administracion-de-consorcios",
    );
    expect(screen.getByRole("link", { name: "Nosotros" })).toHaveAttribute(
      "href",
      "/nosotros",
    );
    expect(screen.getByRole("link", { name: "Contacto" })).toHaveAttribute(
      "href",
      "/contacto",
    );
  });

  it("opens and closes the mobile menu when the toggle buttons are clicked", async () => {
    const user = userEvent.setup();
    render(<Header />);

    const menuButton = screen.getByRole("button", { name: "Menú" });
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    const closeButton = within(dialog).getByRole("button", { name: "Cerrar" });
    await user.click(closeButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the mobile menu when Escape is pressed", async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole("button", { name: "Menú" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Menú" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});

describe("Header favorites link", () => {
  it("links to /favoritos in desktop and mobile menus with a count once mounted", async () => {
    const item = (slug: string, savedAt: number) => ({
      slug,
      title: slug,
      price: 1,
      currency: "USD",
      operation: "sale",
      cover: null,
      neighborhood: "X",
      savedAt,
    });
    localStorage.setItem("siricman:favorites:v1", JSON.stringify([item("a", 1), item("b", 2)]));
    render(<Header />);

    const link = screen.getByRole("link", { name: /Favoritos, 2 guardadas/ });
    expect(link).toHaveAttribute("href", "/favoritos");
    expect(within(link).getByText("2")).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole("button", { name: "Menú" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("link", { name: /Favoritos/ })).toHaveAttribute(
      "href",
      "/favoritos",
    );
    localStorage.clear();
  });

  it("shows no badge when there are no favorites", () => {
    localStorage.clear();
    render(<Header />);
    const link = screen.getByRole("link", { name: "Favoritos" });
    expect(link).toHaveAttribute("href", "/favoritos");
    expect(within(link).queryByText(/\d/)).toBeNull();
  });
});

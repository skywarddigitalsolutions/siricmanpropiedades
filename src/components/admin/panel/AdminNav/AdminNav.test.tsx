import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname }));

import AdminNav from "./AdminNav";
import { ADMIN_NAV_ITEMS } from "./nav-items";

afterEach(() => {
  cleanup();
});

describe("AdminNav", () => {
  it("renders every item from the nav data array with its href", () => {
    usePathname.mockReturnValue("/admin/propiedades");
    render(<AdminNav />);

    for (const item of ADMIN_NAV_ITEMS) {
      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute(
        "href",
        item.href,
      );
    }
  });

  it("includes the leads inbox", () => {
    expect(ADMIN_NAV_ITEMS).toContainEqual({ label: "Consultas", href: "/admin/consultas" });
  });

  it("includes the clients view after the inbox", () => {
    const hrefs = ADMIN_NAV_ITEMS.map((item) => item.href);
    expect(ADMIN_NAV_ITEMS).toContainEqual({ label: "Clientes", href: "/admin/clientes" });
    expect(hrefs.indexOf("/admin/clientes")).toBe(hrefs.indexOf("/admin/consultas") + 1);
  });

  it("shows a badge with the count of new items, announced in words", () => {
    usePathname.mockReturnValue("/admin/propiedades");
    render(<AdminNav badges={{ "/admin/consultas": 3 }} />);

    const link = screen.getByRole("link", { name: "Consultas, 3 nuevas" });
    expect(link).toHaveTextContent("3");
    expect(screen.getByRole("link", { name: "Propiedades" })).toBeInTheDocument();
  });

  it("shows no badge for zero", () => {
    usePathname.mockReturnValue("/admin/propiedades");
    render(<AdminNav badges={{ "/admin/consultas": 0 }} />);

    expect(screen.getByRole("link", { name: "Consultas" })).toBeInTheDocument();
  });

  it("marks the link matching the current pathname with aria-current=page", () => {
    usePathname.mockReturnValue("/admin/propiedades");
    render(<AdminNav />);

    expect(
      screen.getByRole("link", { name: "Propiedades" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("marks the link matching a nested pathname with aria-current=page", () => {
    usePathname.mockReturnValue("/admin/propiedades/nueva");
    render(<AdminNav />);

    expect(
      screen.getByRole("link", { name: "Propiedades" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("does not mark unrelated links as current", () => {
    usePathname.mockReturnValue("/admin/otra-seccion");
    render(<AdminNav />);

    expect(
      screen.getByRole("link", { name: "Propiedades" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("calls onNavigate when a link is clicked", async () => {
    usePathname.mockReturnValue("/admin/propiedades");
    const onNavigate = vi.fn();
    render(<AdminNav onNavigate={onNavigate} />);

    screen.getByRole("link", { name: "Propiedades" }).click();

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});

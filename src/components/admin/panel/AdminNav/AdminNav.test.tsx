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

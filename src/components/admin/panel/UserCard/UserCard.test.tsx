import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import UserCard from "./UserCard";

afterEach(cleanup);

describe("UserCard", () => {
  it("shows initials, the name and the role label", () => {
    render(<UserCard userName="maria.lopez" roles={["manager"]} />);

    expect(screen.getByText("ML")).toBeInTheDocument();
    expect(screen.getByText("maria.lopez")).toBeInTheDocument();
    expect(screen.getByText("Gerente")).toBeInTheDocument();
  });

  it("offers a gear link to the account page, marked current when on it", () => {
    const { rerender } = render(
      <UserCard userName="maria.lopez" roles={["manager"]} accountHref="/admin/cuenta" />,
    );

    const link = screen.getByRole("link", { name: "Mi cuenta" });
    expect(link).toHaveAttribute("href", "/admin/cuenta");
    expect(link.querySelector("svg")).not.toBeNull();
    expect(link).not.toHaveAttribute("aria-current");

    rerender(
      <UserCard userName="maria.lopez" roles={["manager"]} accountHref="/admin/cuenta" accountActive />,
    );
    expect(screen.getByRole("link", { name: "Mi cuenta" })).toHaveAttribute("aria-current", "page");
  });

  it("has no account link unless an href is given", () => {
    render(<UserCard userName="maria.lopez" roles={["manager"]} />);

    expect(screen.queryByRole("link")).toBeNull();
  });

  it("falls back to a user icon when no initials can be derived", () => {
    const { container } = render(<UserCard userName="..." roles={["admin"]} />);

    expect(container.querySelector("svg")).not.toBeNull();
    expect(screen.getByText("Administrador")).toBeInTheDocument();
  });
});

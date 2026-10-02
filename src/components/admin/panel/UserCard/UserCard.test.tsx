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

  it("falls back to a user icon when no initials can be derived", () => {
    const { container } = render(<UserCard userName="..." roles={["admin"]} />);

    expect(container.querySelector("svg")).not.toBeNull();
    expect(screen.getByText("Administrador")).toBeInTheDocument();
  });
});

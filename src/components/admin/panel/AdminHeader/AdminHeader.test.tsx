import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import AdminHeader from "./AdminHeader";

afterEach(() => {
  cleanup();
});

describe("AdminHeader", () => {
  it("renders the signed-in user's name", () => {
    render(<AdminHeader userName="gabriel" />);

    expect(screen.getByText("gabriel")).toBeInTheDocument();
  });

  it("renders a different user's name when given different props", () => {
    render(<AdminHeader userName="carla" />);

    expect(screen.getByText("carla")).toBeInTheDocument();
  });
});

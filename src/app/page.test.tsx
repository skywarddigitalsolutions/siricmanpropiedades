import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home page (smoke)", () => {
  it("renders the brand and the construction note", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Siricman Propiedades" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/en construcción/i)).toBeInTheDocument();
  });
});

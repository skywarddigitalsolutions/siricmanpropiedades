import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import DealStatusBadge from "./DealStatusBadge";

afterEach(() => {
  cleanup();
});

describe("DealStatusBadge", () => {
  it("renders the Spanish label for available", () => {
    render(<DealStatusBadge status="available" />);
    expect(screen.getByText("Disponible")).toBeInTheDocument();
  });

  it("renders the Spanish label for reserved", () => {
    render(<DealStatusBadge status="reserved" />);
    expect(screen.getByText("Reservada")).toBeInTheDocument();
  });

  it("renders the Spanish label for sold", () => {
    render(<DealStatusBadge status="sold" />);
    expect(screen.getByText("Vendida")).toBeInTheDocument();
  });

  it("renders the Spanish label for rented", () => {
    render(<DealStatusBadge status="rented" />);
    expect(screen.getByText("Alquilada")).toBeInTheDocument();
  });
});

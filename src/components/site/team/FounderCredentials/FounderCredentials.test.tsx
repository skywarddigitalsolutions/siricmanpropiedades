import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import FounderCredentials from "./FounderCredentials";

afterEach(() => cleanup());

describe("FounderCredentials", () => {
  it("shows the broker role, license, teaching and experience by default", () => {
    render(<FounderCredentials />);

    expect(screen.getByText("Martillero Público y Corredor Inmobiliario")).toBeInTheDocument();
    expect(screen.getByText("Matrícula N° 10024")).toBeInTheDocument();
    expect(screen.getByText("Docente en UTN")).toBeInTheDocument();
    expect(screen.getByText("+11 años de experiencia")).toBeInTheDocument();
  });

  it("swaps the broker role and license for the consortium registration", () => {
    render(<FounderCredentials variant="consortium" />);

    expect(
      screen.getByText("Administrador de consorcios · Matrícula RPA N° 12221"),
    ).toBeInTheDocument();
    expect(screen.getByText("Docente en UTN")).toBeInTheDocument();
    expect(screen.getByText("+11 años de experiencia")).toBeInTheDocument();
    expect(screen.queryByText("Matrícula N° 10024")).not.toBeInTheDocument();
    expect(screen.queryByText(/Martillero/)).not.toBeInTheDocument();
  });

  it("is inline text, not a bullet list", () => {
    const { container } = render(<FounderCredentials />);

    expect(container.querySelector("ul, ol")).toBeNull();
  });
});

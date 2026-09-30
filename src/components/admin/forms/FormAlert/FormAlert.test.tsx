import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import FormAlert from "./FormAlert";

afterEach(() => {
  cleanup();
});

describe("FormAlert", () => {
  it("renders its message with role=alert", () => {
    render(<FormAlert>Usuario o contraseña incorrectos.</FormAlert>);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Usuario o contraseña incorrectos.",
    );
  });

  it("renders a different message verbatim (proves it is not a hardcoded string)", () => {
    render(<FormAlert>Su sesión expiró. Inicie sesión nuevamente.</FormAlert>);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Su sesión expiró. Inicie sesión nuevamente.",
    );
  });
});

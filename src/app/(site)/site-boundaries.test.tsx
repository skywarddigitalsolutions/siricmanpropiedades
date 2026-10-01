import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SiteError from "./error";
import PropertyNotFound from "./propiedades/[slug]/not-found";

afterEach(() => cleanup());

describe("PropertyNotFound", () => {
  it("explains the property is gone and offers the catalog", () => {
    render(<PropertyNotFound />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Esta propiedad ya no está publicada" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver propiedades disponibles" })).toHaveAttribute(
      "href",
      "/propiedades",
    );
  });
});

describe("SiteError", () => {
  it("lets the visitor retry", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    render(<SiteError error={new Error("boom")} reset={reset} />);

    expect(screen.getByRole("heading", { level: 1, name: "Algo salió mal" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(reset).toHaveBeenCalled();
  });
});

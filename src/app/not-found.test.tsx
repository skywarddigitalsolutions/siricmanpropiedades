import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import NotFound from "./not-found";

afterEach(() => cleanup());

describe("global NotFound", () => {
  it("explains the page is missing and offers the way back, inside the site chrome", () => {
    render(<NotFound />);

    expect(
      screen.getByRole("heading", { level: 1, name: "No encontramos esta página" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver propiedades" })).toHaveAttribute(
      "href",
      "/propiedades",
    );
    expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import PropertyLoading from "./loading";

afterEach(() => cleanup());

describe("PropertyLoading", () => {
  it("announces that the property is loading, with the detail's shape (not the results grid)", () => {
    const { container } = render(<PropertyLoading />);

    expect(screen.getByRole("status")).toHaveTextContent("Cargando propiedad…");
    expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "true");
    // Photos, the price block and the inquiry card stand-ins; no results list.
    expect(container.querySelector("[data-skeleton='gallery']")).not.toBeNull();
    expect(container.querySelector("[data-skeleton='price']")).not.toBeNull();
    expect(container.querySelector("[data-skeleton='inquiry']")).not.toBeNull();
    expect(screen.queryByRole("list")).toBeNull();
  });
});

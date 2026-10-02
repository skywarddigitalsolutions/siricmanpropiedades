import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ServicesGrid } from "./HomeSections";

afterEach(() => cleanup());

describe("ServicesGrid", () => {
  it("links the Consorcios card to the consortium administration page", () => {
    render(<ServicesGrid />);

    expect(screen.getByRole("link", { name: /Consorcios/ })).toHaveAttribute(
      "href",
      "/administracion-de-consorcios",
    );
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge";

afterEach(cleanup);

describe("StatusBadge", () => {
  it("renders its text and exposes the tone", () => {
    render(<StatusBadge tone="success">Publicada</StatusBadge>);

    expect(screen.getByText("Publicada")).toHaveAttribute("data-tone", "success");
  });
});

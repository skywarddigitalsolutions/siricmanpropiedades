import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FAVORITES_KEY, readFavorites } from "@/lib/favorites/store";
import FavoriteToggle from "./FavoriteToggle";

const snapshot = {
  slug: "casa-1",
  title: "Casa 1",
  price: 90000,
  currency: "USD" as const,
  operation: "sale" as const,
  cover: "https://media.test/c.webp",
  neighborhood: "Boedo",
};

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe("FavoriteToggle", () => {
  it("is an unpressed, labelled toggle button that saves and unsaves", async () => {
    const user = userEvent.setup();
    render(<FavoriteToggle property={snapshot} />);

    const button = screen.getByRole("button", { name: "Guardar en favoritos" });
    expect(button).toHaveAttribute("aria-pressed", "false");

    await user.click(button);
    expect(screen.getByRole("button", { name: "Quitar de favoritos" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(readFavorites().map((item) => item.slug)).toEqual(["casa-1"]);

    await user.click(screen.getByRole("button", { name: "Quitar de favoritos" }));
    expect(readFavorites()).toEqual([]);
  });

  it("starts pressed when the property was already saved", () => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([{ ...snapshot, savedAt: 1 }]));
    render(<FavoriteToggle property={snapshot} />);
    expect(screen.getByRole("button", { name: "Quitar de favoritos" })).toBeInTheDocument();
  });

  it("does not bubble clicks to a parent", async () => {
    const user = userEvent.setup();
    let parentClicks = 0;
    render(
      <div onClick={() => (parentClicks += 1)}>
        <FavoriteToggle property={snapshot} />
      </div>,
    );
    await user.click(screen.getByRole("button"));
    expect(parentClicks).toBe(0);
  });

  it("shows a visible label in the labeled variant", () => {
    render(<FavoriteToggle property={snapshot} variant="labeled" />);
    expect(screen.getByRole("button", { name: "Guardar en favoritos" })).toHaveTextContent(
      "Guardar",
    );
  });
});

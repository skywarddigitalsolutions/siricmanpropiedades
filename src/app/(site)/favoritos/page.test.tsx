import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import FavoritesPage, { metadata } from "./page";

describe("/favoritos page", () => {
  it("is kept out of search indexes", () => {
    expect(metadata.robots).toMatchObject({ index: false });
    expect(metadata.title).toBe("Mis favoritos");
  });

  it("renders the heading and the empty state for a visitor with nothing saved", async () => {
    localStorage.clear();
    render(<FavoritesPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Mis favoritos" })).toBeInTheDocument();
    expect(await screen.findByText("Todavía no guardaste propiedades")).toBeInTheDocument();
  });
});

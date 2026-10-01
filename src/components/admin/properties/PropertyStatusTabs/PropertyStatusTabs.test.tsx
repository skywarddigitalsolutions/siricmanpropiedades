import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import PropertyStatusTabs from "./PropertyStatusTabs";

afterEach(() => {
  cleanup();
});

const counts = { draft: 2, published: 5, archived: 1 };

describe("PropertyStatusTabs", () => {
  it("shows one-tap links with counts, Todas being the sum", () => {
    render(<PropertyStatusTabs filters={{}} counts={counts} />);

    expect(screen.getByRole("link", { name: "Todas 8" })).toHaveAttribute(
      "href",
      "/admin/propiedades",
    );
    expect(screen.getByRole("link", { name: "Publicadas 5" })).toHaveAttribute(
      "href",
      "/admin/propiedades?publicationStatus=published",
    );
    expect(screen.getByRole("link", { name: "Borradores 2" })).toHaveAttribute(
      "href",
      "/admin/propiedades?publicationStatus=draft",
    );
    expect(screen.getByRole("link", { name: "Archivadas 1" })).toHaveAttribute(
      "href",
      "/admin/propiedades?publicationStatus=archived",
    );
  });

  it("marks the current status and keeps the other filters", () => {
    render(
      <PropertyStatusTabs
        filters={{ publicationStatus: "draft", q: "boedo" }}
        counts={counts}
      />,
    );

    expect(screen.getByRole("link", { name: "Borradores 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Todas 8" })).toHaveAttribute(
      "href",
      "/admin/propiedades?q=boedo",
    );
  });
});

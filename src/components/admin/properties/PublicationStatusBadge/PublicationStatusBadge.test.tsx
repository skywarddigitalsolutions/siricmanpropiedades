import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import PublicationStatusBadge from "./PublicationStatusBadge";

afterEach(() => {
  cleanup();
});

describe("PublicationStatusBadge", () => {
  it("renders the Spanish label for draft", () => {
    render(<PublicationStatusBadge status="draft" />);
    expect(screen.getByText("Borrador")).toBeInTheDocument();
  });

  it("renders the Spanish label for published", () => {
    render(<PublicationStatusBadge status="published" />);
    expect(screen.getByText("Publicada")).toBeInTheDocument();
  });

  it("renders the Spanish label for archived", () => {
    render(<PublicationStatusBadge status="archived" />);
    expect(screen.getByText("Archivada")).toBeInTheDocument();
  });

  it("conveys status as text, not only color", () => {
    const { container } = render(<PublicationStatusBadge status="draft" />);
    expect(container.textContent).toContain("Borrador");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PublicPropertyImage } from "@/lib/public/types";
import PropertyGallery from "./PropertyGallery";

afterEach(() => cleanup());

const image = (n: number): PublicPropertyImage => ({
  url: `https://media.test/${n}.webp`,
  width: 1600,
  height: 1200,
  thumbnailUrl: `https://media.test/${n}-thumb.webp`,
  thumbnailWidth: 480,
  thumbnailHeight: 360,
});

describe("PropertyGallery", () => {
  it("shows every photo with a descriptive alt and the position", () => {
    render(<PropertyGallery images={[image(1), image(2), image(3)]} title="Casa en Palermo" />);

    expect(screen.getByRole("region", { name: "Fotos de la propiedad" })).toBeInTheDocument();
    expect(screen.getByAltText("Casa en Palermo, foto 1 de 3")).toHaveAttribute(
      "src",
      "https://media.test/1.webp",
    );
    expect(screen.getAllByRole("img")).toHaveLength(3);
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("moves to the next and previous photo with the buttons", async () => {
    const user = userEvent.setup();
    const scrollTo = vi.fn();
    Element.prototype.scrollTo = scrollTo;
    render(<PropertyGallery images={[image(1), image(2)]} title="Casa" />);

    expect(screen.getByRole("button", { name: "Foto anterior" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Foto siguiente" }));

    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: "smooth" }));
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Foto siguiente" })).toBeDisabled();
  });

  it("shows a placeholder without photos", () => {
    render(<PropertyGallery images={[]} title="Casa" />);

    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("Sin fotos por el momento")).toBeInTheDocument();
  });
});

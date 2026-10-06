import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PublicPropertyImage } from "@/lib/public/types";
import PropertyGallery from "./PropertyGallery";

const originalScrollTo = Element.prototype.scrollTo;

// Restore every global a test stubs, so one failure cannot leak into the next test.
afterEach(() => {
  cleanup();
  Element.prototype.scrollTo = originalScrollTo;
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

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

  it("jumps without animation when the visitor prefers reduced motion", async () => {
    const user = userEvent.setup();
    const scrollTo = vi.fn();
    Element.prototype.scrollTo = scrollTo;
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("reduce") }));
    render(<PropertyGallery images={[image(1), image(2)]} title="Casa" />);

    await user.click(screen.getByRole("button", { name: "Foto siguiente" }));

    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: "auto" }));
  });

  it("shows the 'Ver fotos' hint on entry and hides it after 3 seconds", () => {
    vi.useFakeTimers();
    render(<PropertyGallery images={[image(1), image(2)]} title="Casa" />);
    const hint = screen.getByRole("button", { name: "Ver fotos (2)" });

    expect(hint).not.toHaveAttribute("data-hidden");
    act(() => vi.advanceTimersByTime(2999));
    expect(hint).not.toHaveAttribute("data-hidden");
    act(() => vi.advanceTimersByTime(1));
    expect(hint).toHaveAttribute("data-hidden");
    // The counter stays, so the visitor still knows there are more photos.
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("hides the 'Ver fotos' hint as soon as the visitor touches the page", () => {
    render(<PropertyGallery images={[image(1), image(2)]} title="Casa" />);
    const hint = screen.getByRole("button", { name: "Ver fotos (2)" });

    fireEvent.pointerDown(document.body);

    expect(hint).toHaveAttribute("data-hidden");
  });

  it("hides the 'Ver fotos' hint when the visitor scrolls or swipes", () => {
    render(<PropertyGallery images={[image(1), image(2)]} title="Casa" />);
    const hint = screen.getByRole("button", { name: "Ver fotos (2)" });

    fireEvent.scroll(window);

    expect(hint).toHaveAttribute("data-hidden");
  });

  it("keeps the hint while it is being pressed, so the tap still opens the photos", () => {
    render(<PropertyGallery images={[image(1), image(2)]} title="Casa" />);
    const hint = screen.getByRole("button", { name: "Ver fotos (2)" });

    fireEvent.pointerDown(hint);

    expect(hint).not.toHaveAttribute("data-hidden");
  });

  it("shows a placeholder without photos", () => {
    render(<PropertyGallery images={[]} title="Casa" />);

    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("Sin fotos por el momento")).toBeInTheDocument();
  });
});

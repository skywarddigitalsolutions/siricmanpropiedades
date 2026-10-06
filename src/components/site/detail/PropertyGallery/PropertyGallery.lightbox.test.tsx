import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PublicPropertyImage } from "@/lib/public/types";
import PropertyGallery from "./PropertyGallery";

const originalShowModal = HTMLDialogElement.prototype.showModal;
const originalClose = HTMLDialogElement.prototype.close;
const originalScrollIntoView = Element.prototype.scrollIntoView;

afterEach(() => {
  cleanup();
  HTMLDialogElement.prototype.showModal = originalShowModal;
  HTMLDialogElement.prototype.close = originalClose;
  Element.prototype.scrollIntoView = originalScrollIntoView;
});

beforeEach(() => {
  // jsdom has no <dialog> modal API; emulate the bits the lightbox relies on.
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

const image = (n: number): PublicPropertyImage => ({
  url: `https://media.test/${n}.webp`,
  width: 1600,
  height: 1200,
  thumbnailUrl: `https://media.test/${n}-thumb.webp`,
  thumbnailWidth: 480,
  thumbnailHeight: 360,
});
const images = [image(1), image(2), image(3)];

function lightbox() {
  return document.querySelector("dialog") as HTMLDialogElement;
}

describe("PropertyGallery lightbox", () => {
  it("is closed until the visitor opens it from the button", async () => {
    const user = userEvent.setup();
    render(<PropertyGallery images={images} title="Casa" />);
    expect(lightbox()).not.toHaveAttribute("open");

    await user.click(screen.getByRole("button", { name: "Ver fotos (3)" }));

    expect(lightbox()).toHaveAttribute("open");
    expect(within(lightbox()).getByText("1 / 3")).toBeInTheDocument();
  });

  it("opens on the photo that was clicked", async () => {
    const user = userEvent.setup();
    render(<PropertyGallery images={images} title="Casa" />);

    const carousel = screen.getByRole("group", { name: "Carrusel de fotos" });
    await user.click(within(carousel).getByRole("button", { name: "Ampliar foto 2 de 3" }));

    expect(lightbox()).toHaveAttribute("open");
    expect(within(lightbox()).getByText("2 / 3")).toBeInTheDocument();
  });

  it("navigates with arrows and buttons and announces only explicit navigation", async () => {
    const user = userEvent.setup();
    render(<PropertyGallery images={images} title="Casa" />);
    await user.click(screen.getByRole("button", { name: "Ver fotos (3)" }));

    fireEvent.keyDown(lightbox(), { key: "ArrowRight" });
    expect(within(lightbox()).getByText("2 / 3")).toBeInTheDocument();
    expect(within(lightbox()).getByRole("status")).toHaveTextContent("Foto 2 de 3");

    await user.click(within(lightbox()).getByRole("button", { name: "Foto anterior" }));
    expect(within(lightbox()).getByText("1 / 3")).toBeInTheDocument();
    expect(within(lightbox()).getByRole("button", { name: "Foto anterior" })).toBeDisabled();
  });

  it("changes photo with a horizontal swipe", async () => {
    const user = userEvent.setup();
    render(<PropertyGallery images={images} title="Casa" />);
    await user.click(screen.getByRole("button", { name: "Ver fotos (3)" }));

    const stage = within(lightbox()).getByTestId("lightbox-stage");
    fireEvent.pointerDown(stage, { clientX: 300, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(stage, { clientX: 120, clientY: 110, pointerId: 1 });

    expect(within(lightbox()).getByText("2 / 3")).toBeInTheDocument();
  });

  it("closes with the close button and with Escape", async () => {
    const user = userEvent.setup();
    render(<PropertyGallery images={images} title="Casa" />);
    await user.click(screen.getByRole("button", { name: "Ver fotos (3)" }));
    await user.click(within(lightbox()).getByRole("button", { name: "Cerrar" }));
    expect(lightbox()).not.toHaveAttribute("open");

    await user.click(screen.getByRole("button", { name: "Ver fotos (3)" }));
    fireEvent.keyDown(lightbox(), { key: "Escape" });
    expect(lightbox()).not.toHaveAttribute("open");
  });

  it("leaves the inline carousel on the photo the visitor ended on", async () => {
    const user = userEvent.setup();
    render(<PropertyGallery images={images} title="Casa" />);
    await user.click(screen.getByRole("button", { name: "Ver fotos (3)" }));
    await user.click(within(lightbox()).getByRole("button", { name: "Foto siguiente" }));
    await user.click(within(lightbox()).getByRole("button", { name: "Foto siguiente" }));

    await user.click(within(lightbox()).getByRole("button", { name: "Cerrar" }));

    expect(lightbox()).not.toHaveAttribute("open");
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
  });

  it("does not render the lightbox without photos", () => {
    render(<PropertyGallery images={[]} title="Casa" />);
    expect(lightbox()).toBeNull();
    expect(screen.queryByRole("button", { name: /Ver fotos/ })).toBeNull();
  });

  it("says so when a photo fails to load, instead of a blank screen", async () => {
    const user = userEvent.setup();
    render(<PropertyGallery images={images} title="Casa" />);
    await user.click(screen.getByRole("button", { name: "Ver fotos (3)" }));

    fireEvent.error(within(lightbox()).getByAltText("Casa, foto 1 de 3"));

    expect(within(lightbox()).getByText("No pudimos cargar esta foto.")).toBeInTheDocument();
    // The next photo gets a fresh chance.
    await user.click(within(lightbox()).getByRole("button", { name: "Foto siguiente" }));
    expect(within(lightbox()).queryByText("No pudimos cargar esta foto.")).toBeNull();
  });

  it("keeps the current thumbnail in view while navigating", async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const many = Array.from({ length: 12 }, (_, n) => image(n + 1));
    render(<PropertyGallery images={many} title="Casa" />);

    await user.click(within(mosaic()).getByRole("button", { name: "Ver las 12 fotos" }));
    scrollIntoView.mockClear();
    await user.click(within(lightbox()).getByRole("button", { name: "Foto siguiente" }));

    const current = within(lightbox()).getByRole("button", { name: "Ir a la foto 6" });
    expect(current).toHaveAttribute("aria-current", "true");
    expect(scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ block: "nearest", inline: "center" }),
    );
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(current);
  });

  it("opens on the mosaic photo that was clicked (desktop mosaic)", async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 12 }, (_, n) => image(n + 1));
    render(<PropertyGallery images={many} title="Casa" />);

    await user.click(within(mosaic()).getByRole("button", { name: "Ampliar foto 3 de 12" }));

    expect(lightbox()).toHaveAttribute("open");
    expect(within(lightbox()).getByText("3 / 12")).toBeInTheDocument();
  });
});

function mosaic() {
  return screen.getByRole("group", { name: "Fotos destacadas" });
}

describe("PropertyGallery desktop mosaic", () => {
  it("shows one big photo and four small ones, the last inviting to see them all", () => {
    const many = Array.from({ length: 12 }, (_, n) => image(n + 1));
    render(<PropertyGallery images={many} title="Casa" />);

    const tiles = within(mosaic()).getAllByRole("button");
    expect(tiles).toHaveLength(5);
    expect(tiles[4]).toHaveAccessibleName("Ver las 12 fotos");
    expect(tiles[4]).toHaveTextContent("+7 fotos");
  });

  it.each([
    [1, 1],
    [2, 2],
    [3, 3],
    [5, 5],
  ])("adapts to %i photo(s) with %i tile(s), all shown", (count, tiles) => {
    const some = Array.from({ length: count }, (_, n) => image(n + 1));
    render(<PropertyGallery images={some} title="Casa" />);

    expect(within(mosaic()).getAllByRole("button")).toHaveLength(tiles);
    expect(mosaic()).not.toHaveTextContent(/\+\d+ foto/);
  });

  it("with 4 photos shows 3 tiles and says one more is left, in singular", () => {
    const four = Array.from({ length: 4 }, (_, n) => image(n + 1));
    render(<PropertyGallery images={four} title="Casa" />);

    const tiles = within(mosaic()).getAllByRole("button");
    expect(tiles).toHaveLength(3);
    expect(tiles[2]).toHaveTextContent("+1 foto");
    expect(tiles[2]).not.toHaveTextContent("+1 fotos");
  });

  it("is not rendered without photos", () => {
    render(<PropertyGallery images={[]} title="Casa" />);

    expect(screen.queryByRole("group", { name: "Fotos destacadas" })).toBeNull();
  });
});

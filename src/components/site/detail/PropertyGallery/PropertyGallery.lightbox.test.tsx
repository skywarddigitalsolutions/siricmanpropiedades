import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PublicPropertyImage } from "@/lib/public/types";
import PropertyGallery from "./PropertyGallery";

afterEach(() => cleanup());

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

    await user.click(screen.getAllByRole("button", { name: /Ampliar foto/ })[1]);

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

  it("does not render the lightbox without photos", () => {
    render(<PropertyGallery images={[]} title="Casa" />);
    expect(lightbox()).toBeNull();
    expect(screen.queryByRole("button", { name: /Ver fotos/ })).toBeNull();
  });
});

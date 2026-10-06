import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import ShareButton from "./ShareButton";

const originalShare = Object.getOwnPropertyDescriptor(navigator, "share");
const originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");

function setNavigator(key: "share" | "clipboard", value: unknown) {
  Object.defineProperty(navigator, key, { configurable: true, writable: true, value });
}

function restore(key: "share" | "clipboard", descriptor?: PropertyDescriptor) {
  if (descriptor) Object.defineProperty(navigator, key, descriptor);
  else delete (navigator as unknown as Record<string, unknown>)[key];
}

beforeEach(() => {
  setNavigator("share", undefined);
  setNavigator("clipboard", undefined);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  restore("share", originalShare);
  restore("clipboard", originalClipboard);
});

describe("ShareButton", () => {
  it("opens the native share sheet with the title and the page URL", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn();
    setNavigator("share", share);
    setNavigator("clipboard", { writeText });
    render(<ShareButton title="Casa en Palermo" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Compartir" }));
    });

    expect(share).toHaveBeenCalledWith({ title: "Casa en Palermo", url: window.location.href });
    expect(writeText).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("ignores a share the visitor cancels", async () => {
    const share = vi.fn().mockRejectedValue(new DOMException("Cancelled", "AbortError"));
    const writeText = vi.fn();
    setNavigator("share", share);
    setNavigator("clipboard", { writeText });
    render(<ShareButton title="Casa" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Compartir" }));
    });

    expect(writeText).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("falls back to copying when sharing fails for another reason", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setNavigator("share", vi.fn().mockRejectedValue(new DOMException("Blocked", "NotAllowedError")));
    setNavigator("clipboard", { writeText });
    render(<ShareButton title="Casa" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Compartir" }));
    });

    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(screen.getByRole("status")).toHaveTextContent("Link copiado");
  });

  it("copies the link and says so when the browser cannot share", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setNavigator("clipboard", { writeText });
    render(<ShareButton title="Casa" />);
    expect(screen.getByRole("status")).toHaveTextContent("");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Compartir" }));
    });

    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(screen.getByRole("status")).toHaveTextContent("Link copiado");
  });

  it("clears the copied feedback after a moment", async () => {
    vi.useFakeTimers();
    setNavigator("clipboard", { writeText: vi.fn().mockResolvedValue(undefined) });
    render(<ShareButton title="Casa" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Compartir" }));
    });
    expect(screen.getByRole("status")).toHaveTextContent("Link copiado");

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("tells the visitor when the link could not be copied", async () => {
    setNavigator("clipboard", { writeText: vi.fn().mockRejectedValue(new Error("denied")) });
    render(<ShareButton title="Casa" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Compartir" }));
    });

    expect(screen.getByRole("status")).toHaveTextContent("No pudimos copiar el link");
  });
});

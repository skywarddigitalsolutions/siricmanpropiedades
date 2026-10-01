import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import AutoHideNotice from "./AutoHideNotice";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("AutoHideNotice", () => {
  it("announces the message politely and hides it after the delay", () => {
    render(<AutoHideNotice>Cambios guardados.</AutoHideNotice>);

    expect(screen.getByRole("status")).toHaveTextContent("Cambios guardados.");

    act(() => {
      vi.advanceTimersByTime(5999);
    });
    expect(screen.getByRole("status")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("can be dismissed by hand", () => {
    render(<AutoHideNotice>Hola</AutoHideNotice>);

    act(() => {
      screen.getByRole("button", { name: "Cerrar aviso" }).click();
    });

    expect(screen.queryByRole("status")).toBeNull();
  });
});

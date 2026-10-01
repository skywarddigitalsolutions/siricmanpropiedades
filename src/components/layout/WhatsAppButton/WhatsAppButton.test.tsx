import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn(() => "/") }));
vi.mock("next/navigation", () => ({ usePathname }));

import WhatsAppButton from "./WhatsAppButton";
import { buildWhatsAppLink, WHATSAPP_DEFAULT_MESSAGE, WHATSAPP_PHONE } from "@/lib/whatsapp";

afterEach(() => cleanup());

describe("WhatsAppButton", () => {
  it("hides on property pages, which have their own WhatsApp actions", () => {
    usePathname.mockReturnValue("/propiedades/casa-en-palermo");
    render(<WhatsAppButton />);

    expect(screen.queryByRole("link", { name: "Escribinos por WhatsApp" })).toBeNull();
    usePathname.mockReturnValue("/");
  });

  it("stays on the results page", () => {
    usePathname.mockReturnValue("/propiedades");
    render(<WhatsAppButton />);

    expect(screen.getByRole("link", { name: "Escribinos por WhatsApp" })).toBeInTheDocument();
    usePathname.mockReturnValue("/");
  });

  it("renders a link pointing to the configured wa.me address", () => {
    render(<WhatsAppButton />);

    const link = screen.getByRole("link", { name: "Escribinos por WhatsApp" });
    expect(link).toHaveAttribute(
      "href",
      buildWhatsAppLink(WHATSAPP_PHONE, WHATSAPP_DEFAULT_MESSAGE),
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("shows a visible label for desktop while keeping the accessible name", () => {
    render(<WhatsAppButton />);

    const link = screen.getByRole("link", { name: "Escribinos por WhatsApp" });
    expect(link).toHaveTextContent("Escribinos");
  });
});

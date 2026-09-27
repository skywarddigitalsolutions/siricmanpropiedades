import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import WhatsAppButton from "./WhatsAppButton";
import { buildWhatsAppLink, WHATSAPP_DEFAULT_MESSAGE, WHATSAPP_PHONE } from "@/lib/whatsapp";

describe("WhatsAppButton", () => {
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
});

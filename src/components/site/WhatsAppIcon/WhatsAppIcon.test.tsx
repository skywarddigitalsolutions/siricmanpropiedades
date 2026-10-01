import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import WhatsAppIcon from "./WhatsAppIcon";

describe("WhatsAppIcon", () => {
  it("renders the official 24x24 glyph, decorative and sized by prop", () => {
    const { container } = render(<WhatsAppIcon size={20} />);
    const svg = container.querySelector("svg")!;

    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    expect(svg).toHaveAttribute("width", "20");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("fill", "currentColor");
  });
});

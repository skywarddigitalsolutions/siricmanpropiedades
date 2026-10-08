import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Archive, ExternalLink } from "lucide-react";
import IconButton, { IconLink } from "./IconButton";

afterEach(cleanup);

describe("IconButton", () => {
  it("is a button named by aria-label with an icon, a tooltip and no visible text", () => {
    const onClick = vi.fn();
    render(<IconButton label="Retirar Casa" tooltip="Retirar" icon={Archive} onClick={onClick} />);

    const button = screen.getByRole("button", { name: "Retirar Casa" });
    expect(button).toHaveAttribute("data-tooltip", "Retirar");
    expect(button.querySelector("svg")).not.toBeNull();
    expect(button).toHaveTextContent("");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalled();
  });

  it("supports the danger tone and disabled state", () => {
    render(<IconButton label="Eliminar" icon={Archive} tone="danger" disabled />);

    const button = screen.getByRole("button", { name: "Eliminar" });
    expect(button).toHaveAttribute("data-tone", "danger");
    expect(button).toBeDisabled();
  });
});

describe("IconLink", () => {
  it("is an external link named by aria-label with a tooltip", () => {
    render(
      <IconLink
        href="https://example.com"
        label="Ver en el sitio: Casa"
        tooltip="Ver en el sitio"
        icon={ExternalLink}
        external
      />,
    );

    const link = screen.getByRole("link", { name: "Ver en el sitio: Casa" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("data-tooltip", "Ver en el sitio");
  });
});

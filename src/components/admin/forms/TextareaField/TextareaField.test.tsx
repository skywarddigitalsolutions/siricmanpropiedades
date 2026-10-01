import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import TextareaField from "./TextareaField";

afterEach(() => {
  cleanup();
});

describe("TextareaField", () => {
  it("renders a labeled textarea with no aria-invalid/aria-describedby when there is no error", () => {
    render(
      <TextareaField id="description" name="description" label="Descripción" />,
    );

    const textarea = screen.getByLabelText("Descripción");
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).not.toHaveAttribute("aria-invalid");
    expect(textarea).not.toHaveAttribute("aria-describedby");
  });

  it("wires aria-invalid and aria-describedby to the rendered error message when error is set", () => {
    render(
      <TextareaField
        id="description"
        name="description"
        label="Descripción"
        error="Complete la descripción."
      />,
    );

    const textarea = screen.getByLabelText("Descripción");
    expect(textarea).toHaveAttribute("aria-invalid", "true");

    const describedBy = textarea.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy ?? "")).toHaveTextContent(
      "Complete la descripción.",
    );
  });

  it("passes through rest textarea attributes such as rows and placeholder", () => {
    render(
      <TextareaField
        id="description"
        name="description"
        label="Descripción"
        rows={6}
        placeholder="Detalles de la propiedad"
      />,
    );

    const textarea = screen.getByLabelText("Descripción");
    expect(textarea).toHaveAttribute("rows", "6");
    expect(textarea).toHaveAttribute("placeholder", "Detalles de la propiedad");
  });
});

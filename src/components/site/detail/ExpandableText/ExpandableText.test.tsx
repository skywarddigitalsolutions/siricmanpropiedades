import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExpandableText from "./ExpandableText";

afterEach(() => cleanup());

const long = Array.from(
  { length: 6 },
  (_, i) => `Párrafo ${i + 1}. ${"Texto largo de ejemplo. ".repeat(12)}`,
);

describe("ExpandableText", () => {
  it("keeps every paragraph and shows no toggle for short text", () => {
    render(<ExpandableText paragraphs={["Uno.", "Dos."]} />);

    expect(screen.getByText("Uno.")).toBeInTheDocument();
    expect(screen.getByText("Dos.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("clamps long text behind an accessible Ver más / Ver menos toggle", async () => {
    const user = userEvent.setup();
    render(<ExpandableText paragraphs={long} />);

    const toggle = screen.getByRole("button", { name: "Ver más" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getAllByText(/Párrafo \d\./)).toHaveLength(6);

    await user.click(toggle);

    expect(screen.getByRole("button", { name: "Ver menos" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});

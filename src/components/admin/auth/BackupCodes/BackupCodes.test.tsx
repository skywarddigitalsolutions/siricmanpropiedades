import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BackupCodes from "./BackupCodes";

afterEach(() => {
  cleanup();
});

const CODES = Array.from({ length: 10 }, (_, i) => `code-${i}`);

describe("BackupCodes", () => {
  it("renders exactly 10 codes as a list", () => {
    render(<BackupCodes codes={CODES} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(10);
    expect(items[0]).toHaveTextContent("code-0");
  });

  it("keeps the continue-to-login link hidden until the acknowledgement checkbox is checked", async () => {
    const user = userEvent.setup();
    render(<BackupCodes codes={CODES} />);

    expect(
      screen.queryByRole("link", { name: /iniciar sesión/i }),
    ).not.toBeInTheDocument();

    const checkbox = screen.getByRole("checkbox", { name: /los guardé/i });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(
      screen.getByRole("link", { name: /iniciar sesión/i }),
    ).toHaveAttribute("href", "/admin/login");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BackupCodes from "./BackupCodes";

afterEach(() => {
  cleanup();
});

const CODES = Array.from({ length: 10 }, (_, i) => `code-${i}`);

describe("BackupCodes", () => {
  it("renders exactly 10 codes as a list", () => {
    render(<BackupCodes codes={CODES} onFinish={vi.fn()} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(10);
    expect(items[0]).toHaveTextContent("code-0");
  });

  it("keeps the continue button disabled until the acknowledgement checkbox is checked", async () => {
    const user = userEvent.setup();
    const onFinish = vi.fn();
    render(<BackupCodes codes={CODES} onFinish={onFinish} />);

    const button = screen.getByRole("button", { name: /iniciar sesión/i });
    expect(button).toBeDisabled();

    await user.click(button);
    expect(onFinish).not.toHaveBeenCalled();

    const checkbox = screen.getByRole("checkbox", { name: /los guardé/i });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(button).toBeEnabled();
  });

  it("submits the finish action once the codes were acknowledged", async () => {
    const user = userEvent.setup();
    const onFinish = vi.fn();
    render(<BackupCodes codes={CODES} onFinish={onFinish} />);

    await user.click(screen.getByRole("checkbox", { name: /los guardé/i }));
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});

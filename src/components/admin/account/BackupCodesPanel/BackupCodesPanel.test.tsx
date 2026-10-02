import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { BackupCodesState } from "@/lib/account/password-change";
import BackupCodesPanel from "./BackupCodesPanel";

const CODES = ["aaaaaaaaaa", "bbbbbbbbbb", "cccccccccc"];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:codes");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
});

describe("BackupCodesPanel", () => {
  it("explains what backup codes are and asks for an authenticator code", () => {
    render(<BackupCodesPanel action={vi.fn()} />);

    expect(screen.getByText(/Cada código se usa una sola vez/)).toBeInTheDocument();
    expect(screen.getByLabelText("Código de tu app de autenticación")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generar códigos nuevos" })).toBeInTheDocument();
  });

  it("shows an error under the code field", async () => {
    const action = vi.fn(async (): Promise<BackupCodesState> => ({ codeError: "El código no es válido." }));
    const user = userEvent.setup();
    render(<BackupCodesPanel action={action} />);

    await user.type(screen.getByLabelText("Código de tu app de autenticación"), "123456");
    await user.click(screen.getByRole("button", { name: "Generar códigos nuevos" }));

    expect(await screen.findByText("El código no es válido.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("shows the new codes once with a warning, copy-all and download", async () => {
    const action = vi.fn(async (): Promise<BackupCodesState> => ({ codes: CODES }));
    const writeText = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<BackupCodesPanel action={action} />);

    await user.type(screen.getByLabelText("Código de tu app de autenticación"), "123456");
    await user.click(screen.getByRole("button", { name: "Generar códigos nuevos" }));

    for (const code of CODES) expect(await screen.findByText(code)).toBeInTheDocument();
    expect(screen.getByText(/Los códigos anteriores dejan de funcionar/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Copiar todos" }));
    expect(writeText).toHaveBeenCalledWith(CODES.join("\n"));
    expect(await screen.findByText("Copiados")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Descargar .txt" }));
    await waitFor(() => expect(click).toHaveBeenCalled());
    const blob = (URL.createObjectURL as unknown as { mock: { calls: [Blob][] } }).mock.calls[0][0];
    expect(blob.type).toContain("text/plain");
  });
});

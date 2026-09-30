import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  EnableMfaState,
  ConfirmMfaState,
} from "@/app/admin/(auth)/mfa/setup/actions";
import MfaEnrollment from "./MfaEnrollment";

afterEach(() => {
  cleanup();
});

const QR_DATA_URI = "data:image/svg+xml;base64,PHN2Zy8+";
const SECRET = "JBSWY3DPEHPK3PXP";
const BACKUP_CODES = Array.from({ length: 10 }, (_, i) => `code-${i}`);

async function advanceToScanStep(
  enableMfaAction: (password: string) => Promise<EnableMfaState>,
  confirmMfaAction: (code: string) => Promise<ConfirmMfaState>,
) {
  const user = userEvent.setup();
  render(
    <MfaEnrollment
      enableMfaAction={enableMfaAction}
      confirmMfaAction={confirmMfaAction}
    />,
  );

  await user.type(screen.getByLabelText("Contraseña"), "correct-password");
  await user.click(screen.getByRole("button", { name: "Continuar" }));
  await screen.findByAltText("Código QR para la app de autenticación");

  return user;
}

describe("MfaEnrollment", () => {
  it("renders the password step first", () => {
    const enableMfaAction = vi.fn<(password: string) => Promise<EnableMfaState>>();
    const confirmMfaAction = vi.fn<(code: string) => Promise<ConfirmMfaState>>();
    render(
      <MfaEnrollment
        enableMfaAction={enableMfaAction}
        confirmMfaAction={confirmMfaAction}
      />,
    );

    expect(screen.getByLabelText("Contraseña")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    expect(screen.queryByAltText(/Código QR/)).not.toBeInTheDocument();
  });

  it("shows an error and stays on the password step for a wrong password", async () => {
    const enableMfaAction = vi
      .fn<(password: string) => Promise<EnableMfaState>>()
      .mockResolvedValue({ step: "password", error: "invalid-password" });
    const confirmMfaAction = vi.fn<(code: string) => Promise<ConfirmMfaState>>();
    const user = userEvent.setup();
    render(
      <MfaEnrollment
        enableMfaAction={enableMfaAction}
        confirmMfaAction={confirmMfaAction}
      />,
    );

    await user.type(screen.getByLabelText("Contraseña"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La contraseña no es correcta o la verificación expiró.",
    );
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(confirmMfaAction).not.toHaveBeenCalled();
  });

  it("advances to the scan step on a correct password, showing the QR code and the manual secret", async () => {
    const enableMfaAction = vi
      .fn<(password: string) => Promise<EnableMfaState>>()
      .mockResolvedValue({
        step: "scan",
        qrSvgDataUri: QR_DATA_URI,
        secret: SECRET,
      });
    const confirmMfaAction = vi.fn<(code: string) => Promise<ConfirmMfaState>>();

    await advanceToScanStep(enableMfaAction, confirmMfaAction);

    const img = screen.getByAltText("Código QR para la app de autenticación");
    expect(img).toHaveAttribute("src", QR_DATA_URI);
    expect(screen.getByText(SECRET).tagName).toBe("CODE");
  });

  it("shows an error on the confirm step for a wrong code, without revealing backup codes", async () => {
    const enableMfaAction = vi
      .fn<(password: string) => Promise<EnableMfaState>>()
      .mockResolvedValue({
        step: "scan",
        qrSvgDataUri: QR_DATA_URI,
        secret: SECRET,
      });
    const confirmMfaAction = vi
      .fn<(code: string) => Promise<ConfirmMfaState>>()
      .mockResolvedValue({ step: "scan", error: "invalid-code" });

    const user = await advanceToScanStep(enableMfaAction, confirmMfaAction);

    await user.type(
      screen.getByLabelText("Código de confirmación"),
      "000000",
    );
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El código no es válido. Si el problema continúa, vuelva a iniciar sesión.",
    );
    expect(screen.queryByText(/code-0/)).not.toBeInTheDocument();
    // The QR/secret from the earlier successful step must still be visible.
    expect(
      screen.getByAltText("Código QR para la app de autenticación"),
    ).toBeInTheDocument();
  });

  it("shows the 10 backup codes on a correct confirmation code, gated by the acknowledgement checkbox", async () => {
    const enableMfaAction = vi
      .fn<(password: string) => Promise<EnableMfaState>>()
      .mockResolvedValue({
        step: "scan",
        qrSvgDataUri: QR_DATA_URI,
        secret: SECRET,
      });
    const confirmMfaAction = vi
      .fn<(code: string) => Promise<ConfirmMfaState>>()
      .mockResolvedValue({ step: "codes", backupCodes: BACKUP_CODES });

    const user = await advanceToScanStep(enableMfaAction, confirmMfaAction);

    await user.type(
      screen.getByLabelText("Código de confirmación"),
      "123456",
    );
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(await screen.findAllByRole("listitem")).toHaveLength(10);
    expect(
      screen.queryByRole("link", { name: /iniciar sesión/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /los guardé/i }));

    expect(
      screen.getByRole("link", { name: /iniciar sesión/i }),
    ).toHaveAttribute("href", "/admin/login");
  });
});

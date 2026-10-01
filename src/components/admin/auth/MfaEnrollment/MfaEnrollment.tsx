"use client";

import { useState } from "react";
import type {
  ConfirmMfaState,
  EnableMfaState,
} from "@/app/admin/(auth)/mfa/setup/actions";
import FormAlert from "@/components/admin/forms/FormAlert/FormAlert";
import SubmitButton from "@/components/admin/forms/SubmitButton/SubmitButton";
import TextField from "@/components/admin/forms/TextField/TextField";
import BackupCodes from "@/components/admin/auth/BackupCodes/BackupCodes";
import AuthHeading from "../AuthHeading/AuthHeading";
import PasswordField from "@/components/admin/forms/PasswordField/PasswordField";
import { getAuthErrorMessage, type AuthErrorCode } from "../messages";
import styles from "./MfaEnrollment.module.css";

type MfaEnrollmentProps = {
  enableMfaAction: (password: string) => Promise<EnableMfaState>;
  confirmMfaAction: (code: string) => Promise<ConfirmMfaState>;
  finishEnrollmentAction: () => Promise<void>;
};

type WizardState = {
  step: "password" | "scan" | "codes";
  qrSvgDataUri?: string;
  secret?: string;
  backupCodes?: string[];
  error?: AuthErrorCode;
};

const INITIAL_STATE: WizardState = { step: "password" };

/**
 * MFA enrollment wizard (ADR-8's five-step flow). This component owns local
 * step state instead of `useActionState`, because the wizard calls two
 * different Server Actions with different arguments across its steps, and
 * the QR/secret shown after `enableMfaAction` succeeds must survive a wrong
 * confirmation code without a second server round trip — re-calling
 * `mfa/enable` would generate a brand-new secret server-side and invalidate
 * whatever the user already scanned (`design.md` ADR-9/back
 * `MfaService.startEnrollment`).
 *
 * `EnableMfaState`/`ConfirmMfaState` (from `mfa/setup/actions.ts`) split
 * `design.md`'s single `EnrollmentState` contract in two: `confirmMfaAction`
 * only receives `code` (per task 4.9), so its failure shape cannot echo back
 * a `qrSvgDataUri`/`secret` it never had — this component keeps those in its
 * own state instead. See the Deviations note in apply-progress.md.
 */
export default function MfaEnrollment({
  enableMfaAction,
  confirmMfaAction,
  finishEnrollmentAction,
}: MfaEnrollmentProps) {
  const [state, setState] = useState<WizardState>(INITIAL_STATE);

  async function handleEnable(formData: FormData) {
    const password = String(formData.get("password") ?? "");
    const result = await enableMfaAction(password);
    if (result.step === "scan") {
      setState({
        step: "scan",
        qrSvgDataUri: result.qrSvgDataUri,
        secret: result.secret,
      });
    } else {
      setState({ step: "password", error: result.error });
    }
  }

  async function handleConfirm(formData: FormData) {
    const code = String(formData.get("code") ?? "");
    const result = await confirmMfaAction(code);
    if (result.step === "codes") {
      setState({ step: "codes", backupCodes: result.backupCodes });
    } else {
      setState((prev) => ({ ...prev, error: result.error }));
    }
  }

  if (state.step === "codes" && state.backupCodes) {
    return (
      <BackupCodes
        codes={state.backupCodes}
        onFinish={finishEnrollmentAction}
      />
    );
  }

  if (state.step === "scan" && state.qrSvgDataUri && state.secret) {
    return (
      <form action={handleConfirm} className={styles.form}>
        <AuthHeading title="Activá la verificación en dos pasos" />
        <p className={styles.intro}>
          Escanee este código con su aplicación de autenticación.
        </p>
        <img
          src={state.qrSvgDataUri}
          alt="Código QR para la app de autenticación"
          width={200}
          height={200}
        />
        <p className={styles.intro}>
          ¿No puede escanear el código? Ingréselo manualmente:
        </p>
        <code className={styles.secret}>{state.secret}</code>
        {state.error && (
          <FormAlert>{getAuthErrorMessage(state.error)}</FormAlert>
        )}
        <TextField
          id="code"
          name="code"
          label="Código de confirmación"
          autoComplete="one-time-code"
          minLength={6}
          maxLength={10}
          required
        />
        <SubmitButton pendingLabel="Confirmando...">Confirmar</SubmitButton>
      </form>
    );
  }

  return (
    <form action={handleEnable} className={styles.form}>
      <AuthHeading title="Activá la verificación en dos pasos" />
      <p className={styles.intro}>
        Vuelva a ingresar su contraseña para activar la verificación en dos
        pasos.
      </p>
      {state.error && <FormAlert>{getAuthErrorMessage(state.error)}</FormAlert>}
      <PasswordField
        id="password"
        name="password"
        label="Contraseña"
        autoComplete="current-password"
        required
      />
      <SubmitButton pendingLabel="Verificando...">Continuar</SubmitButton>
    </form>
  );
}

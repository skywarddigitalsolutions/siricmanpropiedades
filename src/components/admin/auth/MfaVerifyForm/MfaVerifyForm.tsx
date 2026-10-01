"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { FormState } from "@/app/admin/(auth)/mfa/actions";
import FormAlert from "@/components/admin/forms/FormAlert/FormAlert";
import SubmitButton from "@/components/admin/forms/SubmitButton/SubmitButton";
import TextField from "@/components/admin/forms/TextField/TextField";
import AuthHeading from "../AuthHeading/AuthHeading";
import { getAuthErrorMessage } from "../messages";
import styles from "./MfaVerifyForm.module.css";

type MfaVerifyFormProps = {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
};

type Mode = "app" | "backup";

const INITIAL_STATE: FormState = {};
const APP_CODE_LENGTH = 6;
// Backup codes are 10 lowercase hex characters (back: `randomBytes(5).toString("hex")`).
const BACKUP_CODE_LENGTH = 10;

// No `maxLength` attribute on purpose: browsers truncate a paste to it *before*
// `onChange`, so "123 456" would lose a digit. The handler sanitizes then slices.

/**
 * `/admin/mfa` client form (ADR-8). Two modes, both posting the same `code`
 * field so the Server Action is unchanged:
 * - "app": 6-digit authenticator code, numeric keypad, digits only, submits
 *   itself on the 6th digit.
 * - "backup": 10-character backup code (letters allowed). The back compares it
 *   case-sensitively against lowercase hex, so input is lowercased here.
 */
export default function MfaVerifyForm({ action }: MfaVerifyFormProps) {
  const [state, formAction] = useActionState(action, INITIAL_STATE);
  const [mode, setMode] = useState<Mode>("app");
  const [code, setCode] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const submittedCode = useRef<string | null>(null);
  const modeChanged = useRef(false);

  const isApp = mode === "app";

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value;
    setCode(
      isApp
        ? raw.replace(/\D/g, "").slice(0, APP_CODE_LENGTH)
        : raw
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .slice(0, BACKUP_CODE_LENGTH),
    );
  }

  function switchMode(next: Mode) {
    modeChanged.current = true;
    submittedCode.current = null;
    setCode("");
    setMode(next);
  }

  // Auto-submit once per complete app code. Runs after render so the DOM input
  // already holds the sanitized value when the form is read.
  useEffect(() => {
    if (!isApp) return;
    if (code.length < APP_CODE_LENGTH) {
      submittedCode.current = null;
      return;
    }
    if (submittedCode.current === code) return;
    submittedCode.current = code;
    formRef.current?.requestSubmit();
  }, [code, isApp]);

  // Move focus to the new field after switching modes (not on first render).
  useEffect(() => {
    if (modeChanged.current) inputRef.current?.focus();
  }, [mode]);

  return (
    <form ref={formRef} action={formAction} className={styles.form}>
      <AuthHeading title="Verificá tu identidad">
        Ingresá el código de seguridad para terminar de iniciar sesión.
      </AuthHeading>
      {state.error && <FormAlert>{getAuthErrorMessage(state.error)}</FormAlert>}

      <TextField
        key={mode}
        ref={inputRef}
        id="code"
        name="code"
        label={isApp ? "Código de la app" : "Código de respaldo"}
        value={code}
        onChange={handleChange}
        inputClassName={isApp ? styles.appCode : styles.backupCode}
        inputMode={isApp ? "numeric" : "text"}
        pattern={isApp ? "[0-9]*" : undefined}
        autoComplete={isApp ? "one-time-code" : "off"}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        minLength={isApp ? APP_CODE_LENGTH : undefined}
        aria-describedby="code-hint"
        required
      />
      <p id="code-hint" className={styles.hint}>
        {isApp
          ? "Ingresá los 6 dígitos que muestra tu app de autenticación."
          : "Ingresá uno de los códigos de respaldo que guardaste al activar la verificación."}
      </p>

      <SubmitButton pendingLabel="Verificando...">Verificar</SubmitButton>

      <button
        type="button"
        className={styles.switch}
        onClick={() => switchMode(isApp ? "backup" : "app")}
      >
        {isApp ? "Usar un código de respaldo" : "Usar el código de la app"}
      </button>
    </form>
  );
}

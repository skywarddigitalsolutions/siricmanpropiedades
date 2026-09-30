"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/admin/(auth)/mfa/actions";
import FormAlert from "@/components/admin/forms/FormAlert/FormAlert";
import SubmitButton from "@/components/admin/forms/SubmitButton/SubmitButton";
import TextField from "@/components/admin/forms/TextField/TextField";
import { getAuthErrorMessage } from "../messages";
import styles from "./MfaVerifyForm.module.css";

type MfaVerifyFormProps = {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
};

const INITIAL_STATE: FormState = {};

/**
 * `/admin/mfa` client form (ADR-8). Free-text code field: a TOTP code is 6
 * digits, a backup code is longer and alphanumeric, so the field accepts
 * 6-10 characters of either shape.
 */
export default function MfaVerifyForm({ action }: MfaVerifyFormProps) {
  const [state, formAction] = useActionState(action, INITIAL_STATE);

  return (
    <form action={formAction} className={styles.form}>
      {state.error && <FormAlert>{getAuthErrorMessage(state.error)}</FormAlert>}

      <TextField
        id="code"
        name="code"
        label="Código de verificación"
        autoComplete="one-time-code"
        minLength={6}
        maxLength={10}
        required
      />
      <SubmitButton pendingLabel="Verificando...">Verificar</SubmitButton>
    </form>
  );
}

"use client";

import { useActionState, useState, type FormEvent } from "react";
import FormAlert from "@/components/admin/forms/FormAlert/FormAlert";
import FormNotice from "@/components/admin/forms/FormNotice/FormNotice";
import PasswordField from "@/components/admin/forms/PasswordField/PasswordField";
import SubmitButton from "@/components/admin/forms/SubmitButton/SubmitButton";
import TextField from "@/components/admin/forms/TextField/TextField";
import {
  validatePasswordChange,
  type PasswordFieldErrors,
  type PasswordFormState,
} from "@/lib/account/password-change";
import { PASSWORD_HINT } from "@/lib/password-policy";
import styles from "./PasswordChangeForm.module.css";

type PasswordChangeFormProps = {
  /** `changePasswordAction` from `/admin/cuenta/actions`. */
  action: (prevState: PasswordFormState, formData: FormData) => Promise<PasswordFormState>;
};

const INITIAL_STATE: PasswordFormState = {};

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/**
 * "Cambiar contraseña": current + new + repeat + verification code. The same
 * validation the Server Action runs is applied on submit first, so a typo in
 * the repeat field is caught without a round trip (and without clearing the
 * form); the server stays the authority and maps the back's errors per field.
 */
export default function PasswordChangeForm({ action }: PasswordChangeFormProps) {
  const [state, formAction] = useActionState(action, INITIAL_STATE);
  const [clientErrors, setClientErrors] = useState<PasswordFieldErrors | undefined>();
  const errors = clientErrors ?? state.fieldErrors ?? {};

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const found = validatePasswordChange({
      currentPassword: field(formData, "currentPassword"),
      newPassword: field(formData, "newPassword"),
      confirmPassword: field(formData, "confirmPassword"),
      code: field(formData, "code").trim(),
    });
    setClientErrors(found);
    if (found) event.preventDefault();
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className={styles.form} noValidate>
      {state.message && !clientErrors && <FormNotice>{state.message}</FormNotice>}
      {state.error && !clientErrors && <FormAlert>{state.error}</FormAlert>}

      <PasswordField
        id="current-password"
        name="currentPassword"
        label="Contraseña actual"
        autoComplete="current-password"
        error={errors.currentPassword}
      />

      <div className={styles.group}>
        <TextField
          id="verification-code"
          name="code"
          label="Código de verificación"
          autoComplete="one-time-code"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={10}
          error={errors.code}
          aria-describedby={errors.code ? undefined : "verification-code-hint"}
        />
        <p id="verification-code-hint" className={styles.hint}>
          Los 6 dígitos de tu app de autenticación, o un código de respaldo. Es obligatorio si
          tenés la verificación en dos pasos activada.
        </p>
      </div>

      <PasswordField
        id="new-password"
        name="newPassword"
        label="Nueva contraseña"
        autoComplete="new-password"
        error={errors.newPassword}
        aria-describedby={errors.newPassword ? undefined : "new-password-hint"}
      />

      <PasswordField
        id="confirm-password"
        name="confirmPassword"
        label="Repetir nueva contraseña"
        autoComplete="new-password"
        error={errors.confirmPassword}
      />

      <p id="new-password-hint" className={`${styles.hint} ${styles.wide}`}>
        {PASSWORD_HINT}
      </p>

      <div className={`${styles.actions} ${styles.wide}`}>
        <SubmitButton pendingLabel="Guardando...">Cambiar contraseña</SubmitButton>
      </div>
    </form>
  );
}

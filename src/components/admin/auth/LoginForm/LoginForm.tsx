"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/admin/(auth)/login/actions";
import FormAlert from "@/components/admin/forms/FormAlert/FormAlert";
import SubmitButton from "@/components/admin/forms/SubmitButton/SubmitButton";
import PasswordField from "@/components/admin/forms/PasswordField/PasswordField";
import TextField from "@/components/admin/forms/TextField/TextField";
import { User } from "lucide-react";
import AuthHeading from "../AuthHeading/AuthHeading";
import { getAuthErrorMessage } from "../messages";
import styles from "./LoginForm.module.css";

type LoginFormProps = {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  notice?: string;
};

const INITIAL_STATE: FormState = {};

/**
 * `/admin/login` client form (ADR-8). The password field intentionally never
 * reads from `state` — the API never returns a password, and this form must
 * not invent a way to echo one back either.
 */
export default function LoginForm({ action, notice }: LoginFormProps) {
  const [state, formAction] = useActionState(action, INITIAL_STATE);

  return (
    <form action={formAction} className={styles.form}>
      <AuthHeading title="Ingresá al panel">Usá tu usuario y contraseña para continuar.</AuthHeading>
      {notice && <FormAlert>{notice}</FormAlert>}
      {state.error && <FormAlert>{getAuthErrorMessage(state.error)}</FormAlert>}

      <TextField
        id="userName"
        name="userName"
        label="Usuario"
        icon={<User aria-hidden size={18} />}
        autoComplete="username"
        defaultValue={state.fields?.userName}
        required
      />
      <PasswordField
        id="password"
        name="password"
        label="Contraseña"
        autoComplete="current-password"
        required
      />
      <SubmitButton pendingLabel="Ingresando...">Ingresar</SubmitButton>
    </form>
  );
}

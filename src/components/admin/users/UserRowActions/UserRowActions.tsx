"use client";

import { useActionState, useId, useState } from "react";
import { KeyRound, Power } from "lucide-react";
import FormAlert from "@/components/admin/forms/FormAlert/FormAlert";
import FormNotice from "@/components/admin/forms/FormNotice/FormNotice";
import PasswordField from "@/components/admin/forms/PasswordField/PasswordField";
import SubmitButton from "@/components/admin/forms/SubmitButton/SubmitButton";
import Button from "@/components/admin/ui/Button/Button";
import { PASSWORD_HINT } from "@/lib/password-policy";
import { SELF_DEACTIVATE_MESSAGE, type UserFormState } from "@/lib/users/user-forms";
import styles from "./UserRowActions.module.css";

type Action = (prevState: UserFormState, formData: FormData) => Promise<UserFormState>;

type UserRowActionsProps = {
  userName: string;
  isActive: boolean;
  isSelf: boolean;
  /** `setActiveAction` bound to this user and the target state. */
  toggleAction: Action;
  /** `resetPasswordAction` bound to this user. */
  resetAction: Action;
};

type Mode = "idle" | "confirm" | "reset";

/**
 * Per-user actions: activate/deactivate behind an inline confirmation (never
 * for yourself) and a password reset form. The list remounts a row when its
 * active state changes, which closes any open confirmation.
 */
export default function UserRowActions({
  userName,
  isActive,
  isSelf,
  toggleAction,
  resetAction,
}: UserRowActionsProps) {
  const [mode, setMode] = useState<Mode>("idle");
  const [toggleState, toggleForm] = useActionState(toggleAction, {});
  const [resetState, resetForm] = useActionState(resetAction, {});
  const passwordId = useId();
  const blocked = isActive && isSelf;
  const verb = isActive ? "desactivar" : "activar";

  return (
    <div className={styles.actions}>
      {mode === "idle" && (
        <div className={styles.buttons}>
          <Button
            variant="secondary"
            icon={<Power aria-hidden size={18} />}
            disabled={blocked}
            onClick={() => setMode("confirm")}
          >
            {isActive ? "Desactivar" : "Activar"}
          </Button>
          <Button
            variant="ghost"
            icon={<KeyRound aria-hidden size={18} />}
            onClick={() => setMode("reset")}
          >
            Blanquear contraseña
          </Button>
        </div>
      )}

      {blocked && mode === "idle" && <p className={styles.note}>{SELF_DEACTIVATE_MESSAGE}</p>}

      {mode === "confirm" && (
        <form action={toggleForm} className={styles.panel}>
          <p className={styles.question}>
            {isActive
              ? `¿Desactivar a ${userName}? No va a poder ingresar.`
              : `¿Activar a ${userName}? Va a poder ingresar de nuevo.`}
          </p>
          <div className={styles.buttons}>
            <SubmitButton pendingLabel="Guardando...">{`Sí, ${verb}`}</SubmitButton>
            <Button variant="ghost" onClick={() => setMode("idle")}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {mode === "reset" && (
        <form action={resetForm} className={styles.panel} noValidate>
          <PasswordField
            id={passwordId}
            name="newPassword"
            label="Nueva contraseña"
            autoComplete="new-password"
            error={resetState.fieldErrors?.password}
          />
          <p className={styles.note}>{PASSWORD_HINT}</p>
          <p className={styles.note}>
            Blanquear la contraseña cierra las sesiones de este usuario.
          </p>
          <div className={styles.buttons}>
            <SubmitButton pendingLabel="Guardando...">Guardar contraseña</SubmitButton>
            <Button variant="ghost" onClick={() => setMode("idle")}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {toggleState.error && <FormAlert>{toggleState.error}</FormAlert>}
      {resetState.error && <FormAlert>{resetState.error}</FormAlert>}
      {resetState.message && <FormNotice>{resetState.message}</FormNotice>}
    </div>
  );
}

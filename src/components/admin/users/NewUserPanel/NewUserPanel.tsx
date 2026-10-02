"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import FormAlert from "@/components/admin/forms/FormAlert/FormAlert";
import FormNotice from "@/components/admin/forms/FormNotice/FormNotice";
import PasswordField from "@/components/admin/forms/PasswordField/PasswordField";
import SelectField from "@/components/admin/forms/SelectField/SelectField";
import SubmitButton from "@/components/admin/forms/SubmitButton/SubmitButton";
import TextField from "@/components/admin/forms/TextField/TextField";
import Button from "@/components/admin/ui/Button/Button";
import { PASSWORD_HINT } from "@/lib/password-policy";
import { roleName } from "@/lib/session/user-display";
import type { UserFormState } from "@/lib/users/user-forms";
import styles from "./NewUserPanel.module.css";

type NewUserPanelProps = {
  roles: { id: string; name: string }[];
  /** `createUserAction`. */
  action: (prevState: UserFormState, formData: FormData) => Promise<UserFormState>;
};

/** "Nuevo usuario" button that opens an inline creation form (user, password, role). */
export default function NewUserPanel({ roles, action }: NewUserPanelProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};

  return (
    <div className={styles.wrapper}>
      <div>
        <Button
          variant={open ? "secondary" : "primary"}
          icon={open ? <X aria-hidden size={18} /> : <Plus aria-hidden size={18} />}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Cerrar" : "Nuevo usuario"}
        </Button>
      </div>

      {state.message && <FormNotice>{state.message}</FormNotice>}

      {open && (
        <form action={formAction} className={styles.form} noValidate>
          {state.error && <FormAlert>{state.error}</FormAlert>}
          <TextField
            id="new-user-name"
            name="userName"
            label="Usuario"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            error={errors.userName}
          />
          <div className={styles.group}>
            <PasswordField
              id="new-user-password"
              name="password"
              label="Contraseña"
              autoComplete="new-password"
              error={errors.password}
              aria-describedby={errors.password ? undefined : "new-user-password-hint"}
            />
            <p id="new-user-password-hint" className={styles.hint}>
              {PASSWORD_HINT}
            </p>
          </div>
          <SelectField
            id="new-user-role"
            name="roleId"
            label="Rol"
            placeholder="Elegí un rol"
            options={roles.map((role) => ({ value: role.id, label: roleName(role.name) }))}
            error={errors.roleId}
          />
          <div className={styles.submit}>
            <SubmitButton pendingLabel="Creando...">Crear usuario</SubmitButton>
          </div>
        </form>
      )}
    </div>
  );
}

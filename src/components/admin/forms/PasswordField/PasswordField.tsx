"use client";

import { useState } from "react";
import type { ComponentProps } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import TextField from "../TextField/TextField";
import styles from "./PasswordField.module.css";

type PasswordFieldProps = Omit<ComponentProps<typeof TextField>, "type" | "icon" | "trailing">;

/** Password input with a lock icon and an accessible show/hide toggle. */
export default function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      icon={<Lock aria-hidden size={18} />}
      trailing={
        <button
          type="button"
          className={styles.toggle}
          aria-pressed={visible}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOff aria-hidden size={18} /> : <Eye aria-hidden size={18} />}
        </button>
      }
    />
  );
}

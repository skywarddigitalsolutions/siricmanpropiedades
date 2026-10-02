"use client";

import { useActionState, useState } from "react";
import { Check, Copy, Download, TriangleAlert } from "lucide-react";
import FormAlert from "@/components/admin/forms/FormAlert/FormAlert";
import SubmitButton from "@/components/admin/forms/SubmitButton/SubmitButton";
import TextField from "@/components/admin/forms/TextField/TextField";
import Button from "@/components/admin/ui/Button/Button";
import type { BackupCodesState } from "@/lib/account/password-change";
import styles from "./BackupCodesPanel.module.css";

type BackupCodesPanelProps = {
  /** `regenerateBackupCodesAction` from `/admin/cuenta/actions`. */
  action: (prevState: BackupCodesState, formData: FormData) => Promise<BackupCodesState>;
};

const INITIAL_STATE: BackupCodesState = {};
const FILE_NAME = "siricman-codigos-de-respaldo.txt";

function downloadCodes(codes: string[]) {
  const text = [
    "Siricman Propiedades - códigos de respaldo",
    "Cada código se usa una sola vez. Guardalos en un lugar seguro.",
    "",
    ...codes,
    "",
  ].join("\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = FILE_NAME;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function NewCodes({ codes }: { codes: string[] }) {
  const [copied, setCopied] = useState(false);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked: the codes are still on screen and downloadable.
    }
  }

  return (
    <div className={styles.result}>
      <p className={styles.warning}>
        <TriangleAlert aria-hidden size={18} className={styles.warningIcon} />
        <span>
          Estos códigos se muestran una sola vez. Los códigos anteriores dejan de funcionar.
          Guardalos antes de salir de esta página.
        </span>
      </p>
      <ul className={styles.list}>
        {codes.map((code) => (
          <li key={code} className={styles.code}>
            {code}
          </li>
        ))}
      </ul>
      <div className={styles.buttons}>
        <Button
          variant="secondary"
          icon={copied ? <Check aria-hidden size={18} /> : <Copy aria-hidden size={18} />}
          onClick={copyAll}
        >
          {copied ? "Copiados" : "Copiar todos"}
        </Button>
        <Button
          variant="secondary"
          icon={<Download aria-hidden size={18} />}
          onClick={() => downloadCodes(codes)}
        >
          Descargar .txt
        </Button>
      </div>
    </div>
  );
}

/**
 * "Códigos de respaldo": explains them, asks for a current authenticator code
 * and shows the regenerated set once, with copy-all and download. The codes
 * live only in the action state, so leaving the page loses them by design.
 */
export default function BackupCodesPanel({ action }: BackupCodesPanelProps) {
  const [state, formAction] = useActionState(action, INITIAL_STATE);

  return (
    <div className={styles.panel}>
      <p className={styles.intro}>
        Son 10 códigos para entrar si no tenés tu app de autenticación a mano. Cada código se usa
        una sola vez. Al generar códigos nuevos, los anteriores dejan de funcionar.
      </p>

      <form action={formAction} className={styles.form} noValidate>
        {state.error && <FormAlert>{state.error}</FormAlert>}
        <TextField
          id="backup-totp"
          name="code"
          label="Código de tu app de autenticación"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          maxLength={6}
          error={state.codeError}
        />
        <div className={styles.actions}>
          <SubmitButton pendingLabel="Generando...">Generar códigos nuevos</SubmitButton>
        </div>
      </form>

      {state.codes && <NewCodes codes={state.codes} />}
    </div>
  );
}

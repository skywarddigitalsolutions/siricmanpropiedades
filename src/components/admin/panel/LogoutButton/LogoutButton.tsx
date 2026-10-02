"use client";

import { LogOut } from "lucide-react";
import SubmitButton from "@/components/admin/forms/SubmitButton/SubmitButton";

type LogoutButtonProps = {
  action: () => Promise<void>;
};

/** Subtle full-width "Cerrar sesión" submitting the logout Server Action passed by the `(panel)` layout. */
export default function LogoutButton({ action }: LogoutButtonProps) {
  return (
    <form action={action}>
      <SubmitButton
        pendingLabel="Cerrando sesión..."
        variant="ghost"
        fullWidth
        icon={<LogOut aria-hidden size={18} />}
      >
        Cerrar sesión
      </SubmitButton>
    </form>
  );
}

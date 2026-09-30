"use client";

import SubmitButton from "@/components/admin/forms/SubmitButton/SubmitButton";

type LogoutButtonProps = {
  action: () => Promise<void>;
};

/** Submits the logout Server Action passed by the `(panel)` layout (Requirement: Logout). */
export default function LogoutButton({ action }: LogoutButtonProps) {
  return (
    <form action={action}>
      <SubmitButton pendingLabel="Cerrando sesión...">
        Cerrar sesión
      </SubmitButton>
    </form>
  );
}

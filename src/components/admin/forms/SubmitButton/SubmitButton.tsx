"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { buttonAttrs, type ButtonVariant } from "@/components/admin/ui/Button/Button";

type SubmitButtonProps = {
  children: ReactNode;
  pendingLabel: string;
  variant?: ButtonVariant;
  /** Decorative leading icon (mark it `aria-hidden`). */
  icon?: ReactNode;
  fullWidth?: boolean;
};

/** Submit button that reflects the enclosing form's pending state (ADR-8). */
export default function SubmitButton({
  children,
  pendingLabel,
  variant,
  icon,
  fullWidth,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      {...buttonAttrs({ variant, fullWidth })}
      disabled={pending}
      aria-busy={pending}
    >
      {!pending && icon}
      {pending ? pendingLabel : children}
    </button>
  );
}

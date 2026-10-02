import { useEffect, type RefObject } from "react";

/**
 * After a failed submit the form remounts (to show what was typed) and the
 * browser drops focus. Put it back on the first invalid field, or on the
 * general alert when no field is to blame.
 */
export function useFocusOnError(
  state: { status: string },
  formRef: RefObject<HTMLFormElement | null>,
) {
  useEffect(() => {
    if (state.status !== "error") return;
    const form = formRef.current;
    const target =
      form?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
      form?.querySelector<HTMLElement>('[role="alert"]');
    target?.focus();
  }, [state, formRef]);
}

/** Number of fields with an error (the general message does not count). */
export function countFieldErrors(errors: Record<string, string | undefined>): number {
  return Object.entries(errors).filter(([key, value]) => key !== "general" && value).length;
}

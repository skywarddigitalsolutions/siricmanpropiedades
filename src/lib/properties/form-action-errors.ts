import "server-only";
import { ApiError } from "@/lib/api/client";
import { handleSessionError } from "@/lib/session/session-error";
import {
  extractFormValues,
  mapApiErrorToFields,
  type PropertyFormState,
} from "./property-form";

/**
 * Turns an error from a create/update call into form state for the property
 * form: back validation (400) goes next to the fields, an expired session
 * (401) redirects to the login, a missing/unreachable service becomes a
 * general message. Anything else is rethrown for `error.tsx`. The submitted
 * values always travel back so the user does not lose a long form.
 */
export function toPropertyFormErrorState(
  error: unknown,
  formData: FormData,
): PropertyFormState {
  if (!(error instanceof ApiError)) throw error;
  if (error.status === 401) handleSessionError(error);

  const values = extractFormValues(formData);
  if (error.status === 400) {
    return { fieldErrors: mapApiErrorToFields(error.details), values };
  }
  if (error.status === 0 || error.status >= 500 || error.status === 429) {
    return {
      fieldErrors: {
        general: "No se pudo guardar la propiedad. Probá de nuevo en unos minutos.",
      },
      values,
    };
  }
  throw error;
}

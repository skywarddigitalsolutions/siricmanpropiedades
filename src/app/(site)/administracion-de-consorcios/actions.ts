"use server";

import { ApiError } from "@/lib/api/client";
import { submitLead } from "@/lib/api/leads";
import {
  consortiumValues,
  mapConsortiumApiErrors,
  parseConsortiumForm,
  type ConsortiumFieldErrors,
  type ConsortiumState,
} from "@/lib/leads/consortium-form";

const RETRY = "No pudimos enviar la consulta. Probá de nuevo en unos minutos o escribinos por WhatsApp.";

/** Sends the consortium administration form as a `contact` lead with topic `consortium`. */
export async function sendConsortiumAction(
  _prevState: ConsortiumState,
  formData: FormData,
): Promise<ConsortiumState> {
  const parsed = parseConsortiumForm(formData);
  if ("fieldErrors" in parsed) {
    return { status: "error", fieldErrors: parsed.fieldErrors, values: consortiumValues(formData) };
  }

  try {
    await submitLead(parsed.input);
  } catch (error) {
    return { status: "error", fieldErrors: toFieldErrors(error), values: consortiumValues(formData) };
  }
  return { status: "sent" };
}

function toFieldErrors(error: unknown): ConsortiumFieldErrors {
  if (!(error instanceof ApiError)) return { general: RETRY };
  if (error.status === 429) {
    return { general: "Recibimos varios mensajes seguidos desde tu conexión. Probá de nuevo en un minuto." };
  }
  if (error.status === 400) return mapConsortiumApiErrors(error.details);
  return { general: RETRY };
}

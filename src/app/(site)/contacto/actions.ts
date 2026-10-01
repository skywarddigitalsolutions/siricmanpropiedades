"use server";

import { ApiError } from "@/lib/api/client";
import { submitLead } from "@/lib/api/leads";
import {
  contactValues,
  mapContactApiErrors,
  parseContactForm,
  type ContactFieldErrors,
  type ContactState,
} from "@/lib/leads/contact-form";

const RETRY = "No pudimos enviar el mensaje. Probá de nuevo en unos minutos o escribinos por WhatsApp.";

/** Sends the Contacto page form as a `contact` lead. */
export async function sendContactAction(
  _prevState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = parseContactForm(formData);
  if ("fieldErrors" in parsed) {
    return { status: "error", fieldErrors: parsed.fieldErrors, values: contactValues(formData) };
  }

  try {
    await submitLead({ type: "contact", ...parsed.input });
  } catch (error) {
    return { status: "error", fieldErrors: toFieldErrors(error), values: contactValues(formData) };
  }
  return { status: "sent" };
}

function toFieldErrors(error: unknown): ContactFieldErrors {
  if (!(error instanceof ApiError)) return { general: RETRY };
  if (error.status === 429) {
    return { general: "Recibimos varios mensajes seguidos desde tu conexión. Probá de nuevo en un minuto." };
  }
  if (error.status === 400) return mapContactApiErrors(error.details);
  return { general: RETRY };
}

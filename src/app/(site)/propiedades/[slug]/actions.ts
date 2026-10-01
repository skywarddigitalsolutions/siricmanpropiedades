"use server";

import { ApiError } from "@/lib/api/client";
import { submitLead } from "@/lib/api/leads";
import {
  inquiryValues,
  mapLeadApiErrors,
  parseInquiryForm,
  type InquiryState,
} from "@/lib/leads/inquiry-form";

const RETRY = "No pudimos enviar la consulta. Probá de nuevo en unos minutos o escribinos por WhatsApp.";

/** Sends the property page's inquiry form. The property id is bound by the page. */
export async function sendInquiryAction(
  propertyId: string,
  _prevState: InquiryState,
  formData: FormData,
): Promise<InquiryState> {
  const parsed = parseInquiryForm(formData);
  if ("fieldErrors" in parsed) {
    return { status: "error", fieldErrors: parsed.fieldErrors, values: inquiryValues(formData) };
  }

  try {
    await submitLead({ type: "property_inquiry", propertyId, ...parsed.input });
  } catch (error) {
    return { status: "error", fieldErrors: toFieldErrors(error), values: inquiryValues(formData) };
  }
  return { status: "sent" };
}

function toFieldErrors(error: unknown) {
  if (!(error instanceof ApiError)) return { general: RETRY };
  if (error.status === 429) {
    return { general: "Recibimos varios mensajes seguidos desde tu conexión. Probá de nuevo en un minuto." };
  }
  if (error.status === 400 && error.message === "Property not found") {
    return { general: "Esta propiedad ya no está publicada. Escribinos y te mostramos opciones similares." };
  }
  if (error.status === 400) return mapLeadApiErrors(error.details);
  return { general: RETRY };
}
